import {
  IssueGoodsRequest,
  ReleaseStocksRequest,
  ReserveStocksRequest,
  UnitOfMeasuresOfProductsRequest,
} from "./warehouse.requests";
import { UnitOfMeasuresOfProductsResponse } from "./warehouse.responses";

export interface IWarehouseService {
  recordGoodsIssue(req: IssueGoodsRequest): Promise<void>;

  /**
   * Reserves stock for an operation (e.g. order creation or checkout) to
   * prevent overselling caused by concurrent requests.
   *
   * The reserved quantity is not deducted from inventory. It is only marked as
   * unavailable until the reservation is released.
   */
  reserveStock(req: ReserveStocksRequest): Promise<void>;

  /**
   * Releases a previously reserved quantity, making it available for future
   * reservations.
   *
   * Call this when the operation is cancelled or immediately before issuing the
   * reserved stock.
   */
  releaseStock(req: ReleaseStocksRequest): Promise<void>;

  getUnitOfMeasuresOfProducts(
    req: UnitOfMeasuresOfProductsRequest,
  ): Promise<UnitOfMeasuresOfProductsResponse>;
}
