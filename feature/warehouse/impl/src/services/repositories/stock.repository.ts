import { Barcode } from '@feature/common';
import { Stock } from '@feature/warehouse-api';
import {
  DrizzleBaseRepository,
  DrizzleDbProvider,
  sqlCase,
} from '@infra/db-drizzle';
import { stocks, warehouseRelations } from '@infra/db-drizzle/schema';
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { and, eq, inArray, sql } from 'drizzle-orm';

export type StockDefinitionData = Omit<Stock, 'id' | 'quantity'>;

@Injectable()
export class StockRepository extends DrizzleBaseRepository<
  typeof warehouseRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof warehouseRelations>,
    forUpdateCtx: AsyncLocalStorage<'for_update'>,
    // private readonly cache: StockCache,
  ) {
    super(dbProvider, forUpdateCtx);
  }

  findById(id: string): Promise<Stock | null> {
    const query = this.db.select().from(stocks).where(eq(stocks.id, id));

    return (this.forUpdate ? query.for('update') : query).then(([row]) =>
      !!row ? this.toModel(row) : null,
    );
  }

  findManyById(ids: string[]): Promise<Stock[]> {
    return this.db
      .select()
      .from(stocks)
      .where(inArray(stocks.id, ids))
      .then((rows) => rows.map(this.toModel));
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
      .then(([row]) => (!!row ? this.toModel(row) : null));
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
      .values(this.toRowInsert(stock))
      .returning({
        id: stocks.id,
      })
      .then(([r]) => r);
  }

  async redefine(id: string, stock: StockDefinitionData): Promise<void> {
    await this.db
      .update(stocks)
      .set(this.toRowInsert(stock))
      .where(eq(stocks.id, id));
  }

  private toModel(row: typeof stocks.$inferSelect): Stock {
    return {
      id: row.id,
      quantity: row.qty,
      unitOfMeasure: row.unitOfMeasure,
      barcode: {
        type: row.barcodeType,
        value: row.barcodeValue,
      },
      storageLocation: row.storageLocation ?? undefined,
    };
  }

  private toRowInsert({
    barcode,
    ...rest
  }: Omit<Stock, 'id' | 'quantity'>): typeof stocks.$inferInsert {
    return {
      ...rest,
      barcodeType: barcode.type,
      barcodeValue: barcode.value,
    };
  }
}
