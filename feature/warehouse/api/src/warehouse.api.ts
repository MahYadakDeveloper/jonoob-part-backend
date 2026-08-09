import {
  GetGoodDetailsRequest,
  GetManyGoodDetailsByBarcodeRequest,
  GetManyStockDetailsByBarcodeRequest,
  GetStockRequest,
  GetStocksRequest,
  GetWarehouseViewRequest,
  GetWarehouseViewsRequest,
  GoodIdResolvingRequest,
  GoodsIssuingRequest,
  GoodsReceptionRequest,
  ReceiveReturnedRequest,
  StockExistenceRequest,
  StockReleasingRequest,
  StockReservingRequest,
} from './warehouse.requests';
import {
  GetGoodDetailsResponse,
  GetManyGoodDetailsByBarcodeResponse,
  GetManyStockDetailsByBarcodeResponse,
  GetStockResponse,
  GetStocksResponse,
  GetWarehouseViewResponse,
  GetWarehouseViewsResponse,
  GoodIdResolvingResponse,
  StockExistenceResponse,
} from './warehouse.responses';

export interface WarehouseApi {
  /**
   *
   */
  checkStockExistence(req: StockExistenceRequest): Promise<StockExistenceResponse>;

  /**
   *
   */
  getGoodStock(req: GetStockRequest): Promise<GetStockResponse>;

  /**
   *
   */
  getGoodStocks(req: GetStocksRequest): Promise<GetStocksResponse>;

  /**
   *
   */
  getGoodDetails(req: GetGoodDetailsRequest): Promise<GetGoodDetailsResponse>;

  /**
   *
   */
  getManyStockDetailsByBarcode(
    req: GetManyStockDetailsByBarcodeRequest,
  ): Promise<GetManyStockDetailsByBarcodeResponse>;

  /**
   *
   */
  getWarehouseView(req: GetWarehouseViewRequest): Promise<GetWarehouseViewResponse>;

  /**
   *
   */
  getWarehouseViews(req: GetWarehouseViewsRequest): Promise<GetWarehouseViewsResponse>;

  /**
   *
   */
  resolveGoodId(req: GoodIdResolvingRequest): Promise<GoodIdResolvingResponse>;
  /**
   *
   */
  issueGoods(req: GoodsIssuingRequest): Promise<void>;

  /**
   *
   */
  receiptGoods(req: GoodsReceptionRequest): Promise<void>;

  /**
   *
   */
  receiveCustomerReturn(req: ReceiveReturnedRequest): Promise<void>;

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
