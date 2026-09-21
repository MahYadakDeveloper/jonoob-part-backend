import { Barcode, LineItems, type DbProvider } from '@feature/common';
import { StockDefinitionData, StockRepository } from '@feature/warehouse';
import { Stock } from '@feature/warehouse-api';
import { BaseRepository } from '@infra/common-persistent';
import { PrismaDbClient } from '@infra/db-prisma';
import { Injectable } from '@nestjs/common';
import { type StockCache } from './cache/stock.cache';
import { toStock } from './mapper';

@Injectable()
export class StockRepositoryImpl extends BaseRepository<PrismaDbClient> implements StockRepository {
  constructor(
    dbProvider: DbProvider<PrismaDbClient>,
    private readonly cache: StockCache,
  ) {
    super(dbProvider);
  }

  findById(id: string): Promise<Stock | null> {
    return this.db.
      .findUnique({
        where: {
          id,
        },
      })
      .then((stock) => (stock ? toStock(stock) : null));
  }

  findManyById(ids: string[]): Promise<LineItems<Stock>> {
    return this.db.stock
      .findMany({
        where: {
          id: {
            in: ids,
          },
        },
      })
      .then((stocks) => stocks.map(toStock).toLineItems((s) => s.id));
  }

  findByBarcode(barcode: Barcode): Promise<Stock | null> {
    return this.db.stock
      .findUnique({
        where: {
          barcodeType_barcodeValue: {
            barcodeType: barcode.type,
            barcodeValue: barcode.value,
          },
        },
      })
      .then((stock) => (stock ? toStock(stock) : null));
  }

  async increase(stocks: LineItems<{ id: string; qty: number }>): Promise<void> {
    this.db.$transaction(
      for (const {} of stocks.values()){
        this.db.stock.update({
          where: { id },
          data: {
            quantity: {
              increment: qty,
            },
          },
        }),
      },
    );
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
