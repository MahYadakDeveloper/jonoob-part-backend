import { Barcode } from '@feature/common';
import { Stock } from './warehouse.type';

export interface StockQueryApi {
  /**
   *
   */
  findById(stockId: string): Promise<Stock>;
  findManyById(stockIds: string[]): Promise<Stock[]>;
  findByBarcode(barcode: Barcode): Promise<Stock>;

  /**
   *
   */
  available(
    stockIds: string[],
  ): Promise<{ stockId: string; available: boolean }>;
}
