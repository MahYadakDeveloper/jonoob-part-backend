import { LineItems } from '@feature/common';
import { Stock } from './model/stock';

export interface AvailableStockResponse {
  stock: number;
}

export interface AvailableStocksResponse {
  stocks: LineItems<Stock>;
}

export interface FindStockByBarcodeResponse {
  stock: Stock;
}
