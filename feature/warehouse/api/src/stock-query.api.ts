import { Barcode, Stock } from './warehouse.type';

export const STOCK_QUERY_API = Symbol('STOCK_QUERY_API');

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
  ): Promise<{ stockId: string; available: boolean }[]>;
}
