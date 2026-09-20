import { Barcode, LineItems, type DbProvider } from '@feature/common';
import { StockDefinitionData, StockRepository } from '@feature/warehouse';
import { Stock } from '@feature/warehouse-api';
import { BaseRepository } from '@infra/common-persistent';
import { PrismaDbClient } from '@infra/db-prisma';
import { Injectable } from '@nestjs/common';
import { type StockCache } from './cache/stock.cache';

@Injectable()
export class StockRepositoryImpl extends BaseRepository<PrismaDbClient> implements StockRepository {
  constructor(
    dbProvider: DbProvider<PrismaDbClient>,
    private readonly cache: StockCache,
  ) {
    super(dbProvider);
  }
  findById(id: string): Promise<Stock | null> {
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
