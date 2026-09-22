import { Barcode, LineItems, type DbProvider } from '@feature/common';
import { StockDefinitionData, StockRepository } from '@feature/warehouse';
import { Stock } from '@feature/warehouse-api';
import { BaseRepository } from '@infra/common-persistent';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { type StockCache } from './cache/stock.cache';
import { stock } from './schema';
import { toStock, toStocks } from './stock.mapper';

@Injectable()
export class StockRepositoryImpl extends BaseRepository<NodePgDatabase> implements StockRepository {
  constructor(
    @Inject('DbProvider')
    dbProvider: DbProvider<NodePgDatabase>,
    private readonly cache: StockCache,
  ) {
    super(dbProvider);
  }
  findById(id: string): Promise<Stock | null> {
    return this.db.select().from(stock).where(eq(stock.id, id)).then(toStock);
  }
  findManyById(ids: string[]): Promise<LineItems<Stock>> {
    return this.db.select().from(stock).where(inArray(stock.id, ids)).then(toStocks);
  }

  async findByBarcode(barcode: Barcode): Promise<Stock | null> {
    return this.db
      .select()
      .from(stock)
      .where(and(eq(stock.barcodeType, barcode.type), eq(stock.barcodeValue, barcode.value)))
      .then(toStock);
  }

  async increase(stocks: LineItems<{ id: string; qty: number }>): Promise<void> {
    if (stocks.size === 0) return;

    const items = [...stocks.values()];

    const qty = sql<number>`
      CASE ${sql.join(
        items.map(({ id, qty }) => sql`WHEN ${stock.id} = ${id} THEN ${qty}`),
        sql` `,
      )}
      ELSE 0
      END
    `;

    await this.db
      .update(stock)
      .set({
        qty: sql`${stock.qty} + ${qty}`,
      })
      .where(inArray(stock.id, [...stocks.keys()]));
  }

  decrease(stocks: LineItems<{ id: string; qty: number }>): Promise<void> {
    throw new Error('Method not implemented.');
  }
  adjust(stocks: LineItems<{ id: string; qty: number }>): Promise<void> {
    throw new Error('Method not implemented.');
  }
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
