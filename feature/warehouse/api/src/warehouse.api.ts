import { Barcode, LineItems } from '@feature/common';
import { Stock } from './warehouse.type';

export interface WarehouseApi {
  /**
   *
   */
  findById(req: { stockId: string }): Promise<{ stock: Stock }>;
  findManyById(req: { stockIds: string[] }): Promise<{ stocks: LineItems<Stock> }>;
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

  /**
   *
   */
  quarantine(req: {
    returnId: string;
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void>;

  /**
   * Reserves stock for an operation (e.g. order creation or checkout) to
   * prevent overselling caused by concurrent requests.
   *
   * The reserved quantity is not deducted from inventory. It is only marked as
   * unavailable until the reservation is released.
   */
  reserve(req: {
    referenceId: string;
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void>;

  getReservedStocks(req: {
    referenceId: string;
  }): Promise<{ reserved: LineItems<{ stockId: string; qty: number }> }>;

  /**
   * Releases a previously reserved quantity, making it available for future
   * reservations.
   *
   * Call this when the operation is cancelled or immediately before issuing the
   * reserved stock.
   */
  release(req: {
    referenceId: string;
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void>;
}
