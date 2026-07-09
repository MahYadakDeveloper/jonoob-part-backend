import { Good } from "./model/good";

export interface AvailableStockResponse {
  stock: number;
}

export interface AvailableStocksResponse {
  stocks: Record<string, number>;
}

export interface FindGoodByBarcodeResponse {
  good: Good
}