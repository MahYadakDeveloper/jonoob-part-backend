import { Barcode } from "@feature/common";
import { Good } from "./model/good";
import { GoodDetails } from "./model/good-detials";

export interface StockAdjustmentRequest {
  goodId: string;
  stock: number;
}

export interface GoodsReceptionRequest {
  items: {
    goodId: string;
    quantity: number;
  }[];
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
