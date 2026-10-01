import { Barcode } from '@feature/common';
import { Stock } from '@feature/warehouse-api';
import {
  DrizzleBaseRepository,
  DrizzleDbProvider,
  sqlCase,
} from '@infra/db-drizzle';
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { toStock, toStockRow } from './mappers/stock.mapper';
import { stocks } from './schema/stocks.schema';

export type StockDefinitionData = Omit<Stock, 'id' | 'quantity'>;

@Injectable()
export class StockRepository extends DrizzleBaseRepository {
  constructor(
    dbProvider: DrizzleDbProvider,
    lockContext: AsyncLocalStorage<'for_update'>,
    // private readonly cache: StockCache,
  ) {
    super(dbProvider, lockContext);
  }

  findById(id: string): Promise<Stock | null> {
    const query = this.db.select().from(stocks).where(eq(stocks.id, id));

    return (this.lockMode === 'for_update' ? query.for('update') : query).then(
      ([row]) => (!!row ? toStock(row) : null),
    );
  }

  findManyById(ids: string[]): Promise<Stock[]> {
    return this.db
      .select()
      .from(stocks)
      .where(inArray(stocks.id, ids))
      .then((rows) => rows.map(toStock));
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
      .then(([row]) => (!!row ? toStock(row) : null));
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

  available(ids: string[]): Promise<{ id: string; available: boolean }[]> {
    return this.db
      .select({
        id: stocks.id,
        available: sql<boolean>`${stocks.qty} > 0`,
      })
      .from(stocks)
      .where(inArray(stocks.id, ids));
  }

  define(stock: StockDefinitionData): Promise<{ id: string }> {
    return this.db
      .insert(stocks)
      .values(toStockRow(stock))
      .returning({
        id: stocks.id,
      })
      .then(([r]) => r);
  }

  async redefine(id: string, stock: StockDefinitionData): Promise<void> {
    await this.db
      .update(stocks)
      .set(toStockRow(stock))
      .where(eq(stocks.id, id));
  }
}
