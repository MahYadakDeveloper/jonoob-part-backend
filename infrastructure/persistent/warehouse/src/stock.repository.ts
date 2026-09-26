import { Barcode, LineItems, type DbProvider } from '@feature/common';
import { StockDefinitionData, StockRepository } from '@feature/warehouse';
import { Stock } from '@feature/warehouse-api';
import { BaseRepository, type DbLockContext } from '@infra/common-persistent';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, EmptyRelations, eq, inArray, sql } from 'drizzle-orm';
import type {
  NodePgDatabase,
  NodePgTransaction,
} from 'drizzle-orm/node-postgres';
import { stocks } from './schema/stocks';
import { toStock, toStockInsert, toStocks } from './stock.mapper';
import { sqlCase } from './utils';

@Injectable()
export class DrizzleStockRepository
  extends BaseRepository<NodePgDatabase | NodePgTransaction<EmptyRelations>>
  implements StockRepository
{
  private readonly logger = new Logger(DrizzleStockRepository.name);
  constructor(
    @Inject('DbProvider')
    dbProvider: DbProvider<NodePgDatabase>,
    @Inject('DbLockContext')
    private readonly lock: DbLockContext,
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
      this.lock.current() === 'for_update' ? query.for('update') : query
    ).then(toStock);
  }

  findManyById(ids: string[]): Promise<LineItems<Stock>> {
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

  async increase(items: LineItems<{ id: string; qty: number }>): Promise<void> {
    await this.db
      .update(stocks)
      .set({
        qty: sql`${stocks.qty} + ${sqlCase<number>(
          [...items.values()].map((s) => ({
            when: eq(stocks.id, s.id),
            then: sql`${s.qty}`,
          })),
          sql`0`,
        )}`,
      })
      .where(inArray(stocks.id, [...items.keys()]));
  }

  async decrease(items: LineItems<{ id: string; qty: number }>): Promise<void> {
    await this.db
      .update(stocks)
      .set({
        qty: sql`${stocks.qty} - ${sqlCase<number>(
          [...items.values()].map((s) => ({
            when: eq(stocks.id, s.id),
            then: sql`${s.qty}`,
          })),
          sql`0`,
        )}`,
      })
      .where(inArray(stocks.id, [...items.keys()]));
  }

  async adjust(items: LineItems<{ id: string; qty: number }>): Promise<void> {
    await this.db
      .update(stocks)
      .set({
        qty: sqlCase<number>(
          [...items.values()].map((s) => ({
            when: eq(stocks.id, s.id),
            then: sql`${s.qty}`,
          })),
          sql`0`,
        ),
      })
      .where(inArray(stocks.id, [...items.keys()]));
  }

  available(ids: string[]): Promise<LineItems<{ id: string; qty: number }>> {
    return this.db
      .select({
        id: stocks.id,
        qty: stocks.qty,
      })
      .from(stocks)
      .where(inArray(stocks.id, ids))
      .then((rows) => rows.toLineItems((x) => x.id));
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
