import {
  GoodsIssuingRequest,
  StockReleasingRequest,
  StockReservingRequest,
} from "./warehouse.requests";

export interface IWarehouseService {
  recordGoodsIssue(req: GoodsIssuingRequest): Promise<void>;

  /**
   * Reserves stock for an operation (e.g. order creation or checkout) to
   * prevent overselling caused by concurrent requests.
   *
   * The reserved quantity is not deducted from inventory. It is only marked as
   * unavailable until the reservation is released.
   */
  reserveStock(req: StockReservingRequest): Promise<void>;

  /**
   * Releases a previously reserved quantity, making it available for future
   * reservations.
   *
   * Call this when the operation is cancelled or immediately before issuing the
   * reserved stock.
   */
  releaseStock(req: StockReleasingRequest): Promise<void>;
}
