import { Barcode, LineItems, type DbProvider } from '@feature/common';
import { StockDefinitionData, StockRepository } from '@feature/warehouse';
import { Stock } from '@feature/warehouse-api';
import { BaseRepository, type DbLockContext } from '@infra/common-persistent';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { stock } from './schema';
import { toStock, toStocks } from './stock.mapper';

@Injectable()
export class StockRepositoryImpl
  extends BaseRepository<NodePgDatabase>
  implements StockRepository
{
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
    const query = this.db.select().from(stock).where(eq(stock.id, id));

    return (
      this.lock.current() === 'for_update' ? query.for('update') : query
    ).then(toStock);
  }

  findManyById(ids: string[]): Promise<LineItems<Stock>> {
    return this.db
      .select()
      .from(stock)
      .where(inArray(stock.id, ids))
      .then(toStocks);
  }

  async findByBarcode(barcode: Barcode): Promise<Stock | null> {
    return this.db
      .select()
      .from(stock)
      .where(
        and(
          eq(stock.barcodeType, barcode.type),
          eq(stock.barcodeValue, barcode.value),
        ),
      )
      .then(toStock);
  }

  increase(stocks: LineItems<{ id: string; qty: number }>): Promise<void> {
    return this.db
      .update(stock)
      .set({
        qty: sql`${stock.qty} + ${sql<number>`
          CASE 
            ${sql.join(
              [...stocks.values()].map(
                ({ id, qty }) => sql`WHEN ${stock.id} = ${id} THEN ${qty}`,
              ),
              sql` `,
            )}
          ELSE 0
          END
        `}`,
      })
      .where(inArray(stock.id, [...stocks.keys()]))
      .then();
  }

  decrease(stocks: LineItems<{ id: string; qty: number }>): Promise<void> {
    return this.db
      .update(stock)
      .set({
        qty: sql`${stock.qty} - ${sql<number>`
          CASE 
            ${sql.join(
              [...stocks.values()].map(
                ({ id, qty }) => sql`WHEN ${stock.id} = ${id} THEN ${qty}`,
              ),
              sql` `,
            )}
          ELSE 0
          END
        `}`,
      })
      .where(inArray(stock.id, [...stocks.keys()]))
      .then();
  }

  adjust(stocks: LineItems<{ id: string; qty: number }>): Promise<void> {}
  available(id: string[]): Promise<LineItems<{ id: string; qty: number }>> {
    throw new Error('Method not implemented.');
  }
  define(stock: StockDefinitionData): Promise<{ id: string }> {
    throw new Error('Method not implemented.');
  }
  redefine(id: string, stock: StockDefinitionData): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
