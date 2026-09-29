export interface StockReservationApi {
  /**
   * Reserves stock for an operation (e.g. order creation or checkout) to
   * prevent overselling caused by concurrent requests.
   *
   * The reserved quantity is not deducted from inventory. It is only marked as
   * unavailable until the reservation is released.
   */
  reserve(
    referenceId: string,
    items: {
      stockId: string;
      quantity: number;
    }[],
  ): Promise<void>;

  /**
   * Releases a previously reserved quantity, making it available for future
   * reservations.
   *
   * Call this when the operation is cancelled or immediately before issuing the
   * reserved stock.
   */
  release(
    referenceId: string,
    items: {
      stockId: string;
      quantity: number;
    }[],
  ): Promise<void>;

  reserved(
    referenceId: string,
  ): Promise<{ reserved: { stockId: string; quantity: number }[] }>;
}
