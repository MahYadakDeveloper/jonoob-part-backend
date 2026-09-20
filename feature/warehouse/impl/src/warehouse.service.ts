import {
  Barcode,
  LineItems,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import {
  GetReservedStocksRequest,
  GetReservedStocksResponse,
  GoodsIssuedEventPayload,
  GoodsIssuedEventType,
  GoodsIssuingRequest,
  GoodsReceiptedEventPayload,
  GoodsReceiptedEventType,
  GoodsReceptionRequest,
  ReceiveReturnedRequest,
  Stock,
  StockReleasingByRefIdRequest,
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

  quarantine(req: {
    returnId: string;
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void> {
    throw new Error('Method not implemented.');
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

  issue(req: {
    reference: { id: string; source: string };
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  receipt(req: { items: LineItems<{ stockId: string; qty: number }> }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  reserve(req: {
    referenceId: string;
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  checkReserved(req: { referenceId: string }): Promise<{
    reserved: LineItems<{ stockId: string; qty: number }>;
  }> {
    throw new Error('Method not implemented.');
  }
  release(req: {
    referenceId: string;
    reversed: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getReservedStocks({ referenceId }: GetReservedStocksRequest): Promise<GetReservedStocksResponse> {
    return this.reserver.getReservedStocks({ referenceId }).then((stocks) => ({ stocks }));
  }

  releaseStockByRefId({ referenceId }: StockReleasingByRefIdRequest): Promise<void> {
    return this.reserver.releaseStocksByRef({ reference: referenceId });
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

  /**
   * Records the receipt of goods into the warehouse and updates stock levels.
   *
   * After the stock has been successfully updated, a `warehouse.goods-receipted`
   * event is published so other modules can react to the completed inventory
   * change.
   *
   * The Procurement module listens for this event to re-evaluate reorder points.
   * An event is used instead of a direct service call to keep Warehouse
   * decoupled from Procurement, since inventory changes may originate from
   * different modules (e.g. purchase receipts, sales returns, inventory
   * adjustments, or other warehouse operations).
   *
   * The `warehouse.goods-receipted` is emitted as an event because stock changes can originate from
   * multiple modules (e.g. POS sales, sales returns, manual warehouse operations).
   * Procurement should react only to the completed stock movement, without
   * depending on which module initiated it.
   *
   * @param req The goods receipt request containing the items to receive.
   */
  async receiptGoods({ items, reference }: GoodsReceptionRequest): Promise<void> {
    await this.tx.run(async () => {
      await this.repository.increase(items);

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

  async receiveCustomerReturn(req: ReceiveReturnedRequest): Promise<void> {
    await this.stockQuarantine.quarantine({
      items: req.items,
      reason: 'customer_return',
      referenceId: req.returnId,
    });
  }

  async issueGoods({ items, reference }: GoodsIssuingRequest): Promise<void> {
    await this.tx.run(async () => {
      await this.repository.issue(items);

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
}
