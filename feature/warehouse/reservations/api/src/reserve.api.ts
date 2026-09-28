import { LineItems } from '@feature/common';

export interface StockReserverApi {
  /**
   * Reserves stock for an operation (e.g. order creation or checkout) to
   * prevent overselling caused by concurrent requests.
   *
   * The reserved quantity is not deducted from inventory. It is only marked as
   * unavailable until the reservation is released.
   */
  reserve(req: {
    referenceId: string;
    items: LineItems<{
      stockId: string;
      qty: number;
    }>;
  }): Promise<void>;

  /**
   * Releases a previously reserved quantity, making it available for future
   * reservations.
   *
   * Call this when the operation is cancelled or immediately before issuing the
   * reserved stock.
   */
  release(req: {
    referenceId: string;
    items: LineItems<{
      stockId: string;
      qty: number;
    }>;
  }): Promise<void>;

  getReservedStocks(req: {
    referenceId: string;
  }): Promise<{ reserved: LineItems<{ stockId: string; qty: number }> }>;
}
