import { LineItems } from "@feature/common";
import { Good } from "./model/good";
import { Stock } from "./model/stock";

export interface AvailableStockResponse {
  stock: number;
}

export interface AvailableStocksResponse {
  stocks: LineItems<Stock>;
}

export interface FindGoodByBarcodeResponse {
  good: Good;
}
