import { Barcode, LineItems } from '@feature/common';
import { Stock } from './warehouse.type';

export interface WarehouseApi {
  /**
   *
   */
  findById(req: { stockId: string }): Promise<{ stock: Stock }>;
  findManyById(req: {
    stockIds: string[];
  }): Promise<{ stocks: LineItems<Stock> }>;
  findByBarcode(req: { barcode: Barcode }): Promise<{ stock: Stock }>;

  /**
   *
   */
  check(req: { stockId: string }): Promise<
    | {
        available: false;
      }
    | {
        available: true;
        qty: number;
      }
  >;

  checkMany(req: { stockIds: string[] }): Promise<{
    results: LineItems<
      { stockId: string } & (
        | {
            available: false;
          }
        | {
            available: true;
            qty: number;
          }
      )
    >;
  }>;

  /**
   *
   */
  issue(req: {
    reference: {
      id: string;
      source: string;
    };
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void>;

  /**
   *
   */
  receipt(req: {
    reference: {
      id: string;
      source: string;
    };
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void>;

  decrease(req: {
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void>;

  increase(req: {
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void>;
}
