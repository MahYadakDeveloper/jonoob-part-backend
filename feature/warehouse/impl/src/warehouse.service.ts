import {
  Barcode,
  LineItems,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import {
  GoodsIssuedEventPayload,
  GoodsIssuedEventType,
  GoodsReceiptedEventPayload,
  GoodsReceiptedEventType,
  Stock,
  WarehouseApi,
} from '@feature/warehouse-api';
import { type StockQuarantineApi } from '@feature/warehouse-quarantine-api';
import { type StockReserverApi } from '@feature/warehouse-reserve-api';
import { type TransactionRecorderApi } from '@feature/warehouse-transaction-api';
import { Injectable } from '@nestjs/common';
import { StockDefinitionData, type StockRepository } from './repository/stock.repository';

@Injectable()
export class WarehouseService implements WarehouseApi {
  constructor(
    private readonly repository: StockRepository,
    private readonly quarantineManager: StockQuarantineApi,
    private readonly reserver: StockReserverApi,
    private readonly recorder: TransactionRecorderApi,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {}

  check({
    stockId,
  }: {
    stockId: string;
  }): Promise<{ available: false } | { available: true; qty: number }> {
    return this.repository.findById(stockId).then((stock) => {
      if (!stock) throw new Error();
      return stock.qty > 0
        ? {
            available: true,
            qty: stock.qty,
          }
        : { available: false };
    });
  }

  checkMany({ stockIds }: { stockIds: string[] }): Promise<{
    results: LineItems<
      { stockId: string } & ({ available: false } | { available: true; qty: number })
    >;
  }> {
    return this.repository.findManyById(stockIds).then((stocks) => {
      const hasMissing = stockIds.every((id) => !stocks.has(id));
      if (hasMissing) throw new Error();

      return {
        results: stocks.transform(
          (stock) =>
            stock.qty > 0
              ? {
                  stockId: stock.id,
                  available: true,
                  qty: stock.qty,
                }
              : {
                  stockId: stock.id,
                  available: false,
                },
          (s) => s.stockId,
        ),
      };
    });
  }

  quarantine({
    items,
    returnId,
  }: {
    returnId: string;
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void> {
    return this.quarantineManager.quarantine({
      items,
      reason: 'customer_return',
      referenceId: returnId,
    });
  }

  findById({ stockId }: { stockId: string }): Promise<{
    stock: Stock;
  }> {
    return this.repository.findById(stockId).then((stock) => {
      if (!stock) throw new Error();
      return { stock };
    });
  }

  findManyById({ stockIds }: { stockIds: string[] }): Promise<{
    stocks: LineItems<Stock>;
  }> {
    return this.repository.findManyById(stockIds).then((stocks) => ({ stocks }));
  }

  findByBarcode({ barcode }: { barcode: Barcode }): Promise<{
    stock: Stock;
  }> {
    return this.repository.findByBarcode(barcode).then((stock) => {
      if (!stock) throw new Error();
      return { stock };
    });
  }

  async issue({
    items,
    reference,
  }: {
    reference: { id: string; source: string };
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void> {
    await this.tx.run(async () => {
      await this.repository.decrease(
        items.transform(
          (s) => ({ id: s.stockId, qty: s.qty }),
          (s) => s.id,
        ),
      );

      // [TODO] Move it inside event handler no need the recorder be here
      await this.recorder.record({
        type: 'outbound',
        items,
        reference,
      });

      await this.outbox.save({
        type: GoodsIssuedEventType,
        payload: {
          goodIds: [...items.keys()],
        } satisfies GoodsIssuedEventPayload,
      });
    });
  }

  async receipt({
    reference,
    items,
  }: {
    reference: { id: string; source: string };
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void> {
    await this.tx.run(async () => {
      await this.repository.increase(
        items.transform(
          (s) => ({ id: s.stockId, qty: s.qty }),
          (s) => s.id,
        ),
      );

      // [TODO] Move it inside event handler no need the recorder be here
      await this.recorder.record({
        type: 'inbound',
        items,
        reference,
      });

      await this.outbox.save({
        type: GoodsReceiptedEventType,
        payload: {
          goodIds: [...items.keys()],
        } satisfies GoodsReceiptedEventPayload,
      });
    });
  }

  async reserve(req: {
    referenceId: string;
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void> {
    await this.tx.run(async () => {
      await this.repository.decrease(
        req.items.transform(
          (s) => ({ id: s.stockId, qty: s.qty }),
          (s) => s.id,
        ),
      );

      await this.reserver.reserve(req);
    });
  }

  getReservedStocks(req: { referenceId: string }): Promise<{
    reserved: LineItems<{ stockId: string; qty: number }>;
  }> {
    return this.reserver.getReservedStocks(req);
  }

  async release(req: {
    referenceId: string;
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void> {
    await this.tx.run(async () => {
      await this.repository.increase(
        req.items.transform(
          (r) => ({ id: r.stockId, qty: r.qty }),
          (r) => r.id,
        ),
      );

      await this.reserver.release(req);
    });
  }

  async define({ definition }: { definition: StockDefinitionData }): Promise<{ stockId: string }> {
    const exists = !!(await this.repository.findByBarcode(definition.barcode));

    if (exists) {
      throw new Error('Already defined a stock with given barcode');
    }

    const { id } = await this.repository.define(definition);

    return { stockId: id };
  }

  async redefine({
    stockId,
    definition,
  }: {
    stockId: string;
    definition: StockDefinitionData;
  }): Promise<void> {
    const exists = await this.repository.findById(stockId);

    if (!exists) {
      throw new Error('Stock is not defined with given id');
    }

    await this.repository.redefine(stockId, definition);
  }
}
