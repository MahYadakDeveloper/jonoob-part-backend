import { Barcode } from '@feature/shared/types/barcode';
import { ensureFound } from '@feature/shared/utils/assertions';
import { Stock, StockQueryApi } from '@feature/warehouse-api/stock-query.api';
import { NotFoundException } from '@nestjs/common';
import { StockRepository } from './stock.repository';

export class StockQueryApiImpl implements StockQueryApi {
  constructor(private readonly stocks: StockRepository) {}
  findById({ stockId }: { stockId: string }): Promise<Stock> {
    return this.stocks
      .findById(stockId)
      .then((s) =>
        ensureFound(s, () => new NotFoundException('Stock not found')),
      );
  }
  findManyById(input: { stockIds: string[] }): Promise<Stock[]> {
    throw new Error('Method not implemented.');
  }
  findByBarcode(input: { barcode: Barcode }): Promise<Stock> {
    throw new Error('Method not implemented.');
  }
  available(input: {
    stockIds: string[];
  }): Promise<{ stockId: string; available: boolean }[]> {
    throw new Error('Method not implemented.');
  }
}
