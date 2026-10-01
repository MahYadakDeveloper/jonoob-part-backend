import { Barcode } from '@feature/common';
import { Stock, StockQueryApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { StockRepository } from './repository/drizzle-stock.repository';

@Injectable()
export class StockService implements StockQueryApi {
  constructor(private readonly repository: StockRepository) {}

  findById(stockId: string): Promise<Stock> {
    throw new Error('Method not implemented.');
  }
  findManyById(stockIds: string[]): Promise<Stock[]> {
    throw new Error('Method not implemented.');
  }
  findByBarcode(barcode: Barcode): Promise<Stock> {
    throw new Error('Method not implemented.');
  }
  available(
    stockIds: string[],
  ): Promise<{ stockId: string; available: boolean }> {
    throw new Error('Method not implemented.');
  }
}
