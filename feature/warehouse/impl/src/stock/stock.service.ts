import {
  Barcode,
  Stock as StockDto,
  StockQueryApi,
} from '@feature/warehouse-api';
import { DrizzleTransactionContext } from '@infra/db-drizzle';
import { Injectable } from '@nestjs/common';
import { Outbox } from '@nestjs/outbox';
import { StockRepository } from './stock.repository';

@Injectable()
export class StockService implements StockQueryApi {
  constructor(
    private readonly repository: StockRepository,
    private readonly tx: DrizzleTransactionContext,
    private readonly outbox: Outbox,
  ) {}

  findById(stockId: string): Promise<StockDto> {
    return this.repository.findById(stockId).then((stock) => {
      if (!stock) throw new Error('');
      return stock;
    });
  }

  findManyById(stockIds: string[]): Promise<StockDto[]> {
    return this.repository.findManyById(stockIds).then((stocks) => {
      assertAllExist(
        stockIds,
        stocks.map((s) => s.id),
        'stocks',
      );

      return stocks;
    });
  }

  findByBarcode(barcode: Barcode): Promise<StockDto> {
    return this.repository.findByBarcode(barcode).then((stock) => {
      if (!stock) throw new Error('');
      return stock;
    });
  }

  page(criteria: Parameters<typeof this.repository.page>[0]) {
    return this.repository.page(criteria);
  }

  async available(
    ids: string[],
  ): Promise<{ stockId: string; available: boolean }[]> {
    const stocks = await this.repository.available(ids);
    return stocks.map((s) => ({ stockId: s.id, available: s.available }));
  }

  increase(items: { stockId: string; quantity: number }[]): Promise<void> {
    return this.tx.run(async () => {
      const stocks = await this.repository.withForUpdate(async () =>
        this.repository.findManyById(items.map(({ stockId }) => stockId)),
      );

      assertAllExist(
        items.map((s) => s.stockId),
        stocks.map((s) => s.id),
        'stocks',
      );

      await this.repository.increase(
        items.map((item) => ({ id: item.stockId, quantity: item.quantity })),
      );
    });
  }

  decrease(items: { stockId: string; quantity: number }[]): Promise<void> {
    return this.tx.run(async () => {
      const decreaseItems = aggregateQuantities(items);

      const stocks = await this.repository.withForUpdate(() =>
        this.repository.findManyById(decreaseItems.map((item) => item.stockId)),
      );

      assertAllExist(
        decreaseItems.map((item) => item.stockId),
        stocks.map((stock) => stock.id),
        'Stocks',
      );

      assertSufficientStock(stocks, decreaseItems);

      await this.repository.decrease(
        decreaseItems.map(({ stockId, quantity }) => ({
          id: stockId,
          quantity,
        })),
      );

      await this.outbox.add(this.tx.current!, {
        topic: 'stock.decreased',
        payload: {
          items: decreaseItems,
        },
      });
    });
  }

  define(definition: Parameters<StockRepository['define']>[0]) {
    return this.repository.define(definition);
  }

  redefine(
    stockId: string,
    definition: Parameters<StockRepository['redefine']>[1],
  ) {
    return this.repository.redefine(stockId, definition);
  }

  delete(id: string) {
    return this.repository.delete(id);
  }
}

function assertAllExist(
  target: string[],
  source: string[],
  label: string,
): void {
  const existing = new Set(source);
  const missing = [...new Set(target)].filter((id) => !existing.has(id));

  if (missing.length > 0) {
    throw new Error(`${label} not found: ${missing.join(', ')}`);
  }
}

function aggregateQuantities(
  items: { stockId: string; quantity: number }[],
): { stockId: string; quantity: number }[] {
  const quantities = new Map<string, number>();

  for (const { stockId, quantity } of items) {
    quantities.set(stockId, (quantities.get(stockId) ?? 0) + quantity);
  }

  return [...quantities].map(([stockId, quantity]) => ({
    stockId,
    quantity,
  }));
}

function assertSufficientStock(
  stocks: StockDto[],
  items: { stockId: string; quantity: number }[],
): void {
  const quantities = new Map(
    items.map((item) => [item.stockId, item.quantity]),
  );

  for (const stock of stocks) {
    const quantity = quantities.get(stock.id)!;

    if (quantity > stock.quantity) {
      throw new Error('...');
    }
  }
}
