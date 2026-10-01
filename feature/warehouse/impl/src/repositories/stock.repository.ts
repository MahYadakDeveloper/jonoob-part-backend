import { Barcode } from '@feature/common';
import { Stock } from '@feature/warehouse-api';
import {
  DrizzleBaseRepository,
  DrizzleDbProvider,
  sqlCase,
  stocks,
} from '@infra/db-drizzle';
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { toStock, toStockInsert, toStocks } from './stock.mapper';

export type StockDefinitionData = Omit<Stock, 'id' | 'quantity'>;

@Injectable()
export class StockRepository extends DrizzleBaseRepository {
  constructor(
    dbProvider: DrizzleDbProvider,
    private readonly lock: AsyncLocalStorage<'for_update'>,
    // private readonly cache: StockCache,
  ) {
    super(dbProvider);
  }

  withLock<T>(fn: () => Promise<T>): Promise<T> {
    return this.lock.run('for_update', fn);
  }

  findById(id: string): Promise<Stock | null> {
    const query = this.db.select().from(stocks).where(eq(stocks.id, id));

    return (
      this.lock.getStore() === 'for_update' ? query.for('update') : query
    ).then(toStock);
  }

  findManyById(ids: string[]): Promise<Stock[]> {
    return this.db
      .select()
      .from(stocks)
      .where(inArray(stocks.id, ids))
      .then(toStocks);
  }

  async findByBarcode(barcode: Barcode): Promise<Stock | null> {
    return this.db
      .select()
      .from(stocks)
      .where(
        and(
          eq(stocks.barcodeType, barcode.type),
          eq(stocks.barcodeValue, barcode.value),
        ),
      )
      .then(toStock);
  }

  async increase(items: { id: string; quantity: number }[]): Promise<void> {
    await this.db
      .update(stocks)
      .set({
        qty: sql`${stocks.qty} + ${sqlCase<number>(
          items.map((s) => ({
            when: eq(stocks.id, s.id),
            then: sql`${s.quantity}`,
          })),
          sql`0`,
        )}`,
      })
      .where(
        inArray(
          stocks.id,
          items.map(({ id }) => id),
        ),
      );
  }

  async decrease(items: { id: string; quantity: number }[]): Promise<void> {
    await this.db
      .update(stocks)
      .set({
        qty: sql`${stocks.qty} - ${sqlCase<number>(
          items.map((s) => ({
            when: eq(stocks.id, s.id),
            then: sql`${s.quantity}`,
          })),
          sql`0`,
        )}`,
      })
      .where(
        inArray(
          stocks.id,
          items.map(({ id }) => id),
        ),
      );
  }

  async adjust(items: { id: string; quantity: number }[]): Promise<void> {
    await this.db
      .update(stocks)
      .set({
        qty: sqlCase<number>(
          items.map((s) => ({
            when: eq(stocks.id, s.id),
            then: sql`${s.quantity}`,
          })),
          sql`0`,
        ),
      })
      .where(
        inArray(
          stocks.id,
          items.map(({ id }) => id),
        ),
      );
  }

  available(ids: string[]): Promise<{ id: string; quantity: number }[]> {
    return this.db
      .select({
        id: stocks.id,
        quantity: stocks.qty,
      })
      .from(stocks)
      .where(inArray(stocks.id, ids));
  }

  define(stock: StockDefinitionData): Promise<{ id: string }> {
    return this.db
      .insert(stocks)
      .values(toStockInsert(stock))
      .returning({
        id: stocks.id,
      })
      .then(([r]) => r);
  }

  async redefine(id: string, stock: StockDefinitionData): Promise<void> {
    await this.db
      .update(stocks)
      .set(toStockInsert(stock))
      .where(eq(stocks.id, id));
  }
}
