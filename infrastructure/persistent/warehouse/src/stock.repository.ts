import { Barcode, LineItems, type DbProvider } from '@feature/common';
import { StockDefinitionData, StockRepository } from '@feature/warehouse';
import { Stock } from '@feature/warehouse-api';
import { BaseRepository } from '@infra/common-persistent';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { type StockCache } from './cache/stock.cache';
import { stockTable } from './schema/stock';

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
    this.db
      .select()
      .from(stockTable)
      .where((s) => eq(s.id, 2));
    throw new Error('Method not implemented.');
  }
  findManyById(ids: string[]): Promise<LineItems<Stock>> {
    throw new Error('Method not implemented.');
  }
  findByBarcode(barcode: Barcode): Promise<Stock | null> {
    throw new Error('Method not implemented.');
  }
  increase(stocks: LineItems<{ id: string; qty: number }>): Promise<void> {
    throw new Error('Method not implemented.');
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
