import { Barcode } from "@feature/common";
import { GoodDetails } from "./model/good-details";
import { Stock } from "./model/stock";

export interface StockAdjustmentRequest {
  stock: Stock;
}

export interface AvailableStocksRequest {
  goodIds: string[];
}
export interface AvailableStockRequest {
  goodId: string;
}

export interface FindGoodByBarcodeRequest {
  barcode: Barcode;
}

export interface GoodUpdateRequest {
  goodId: string;
  details: GoodDetails;
}
