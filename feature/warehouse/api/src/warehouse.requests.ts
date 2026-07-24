import { Barcode, LineItems } from "@feature/common";

export interface GoodIdResolvingRequest {
  barcode: Barcode;
}

type Item = { goodId: string; quantity: number };

export interface GoodsIssuingRequest {
  items: LineItems<Item>;
}

export interface StockReservingRequest {
  items: LineItems<Item>;
}

export interface StockReleasingRequest {
  items: LineItems<Item>;
}

export interface ReceiveReturnedRequest {
  returnId: string;
  items: LineItems<Item>;
}

export interface GetStockRequest {
  goodId: string;
}

export interface GetStocksRequest {
  goodIds: string[];
}

export interface GetGoodDetailsRequest {
  goodId: string;
}

export interface GetWarehouseViewRequest {
  goodId: string;
}

export interface GetWarehouseViewsRequest {
  goodIds: string[];
}
