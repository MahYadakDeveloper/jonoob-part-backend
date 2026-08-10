import { LineItems } from '@feature/common';
import { Stock, StockDetails } from './warehouse.types';

export interface StockExistenceResponse {
  stocks: LineItems<{ goodId: string; exists: boolean }>;
}

export interface GoodIdResolvingResponse {
  goodId: string;
}

export interface GetStockResponse {
  stock: number;
}

export interface GetStocksResponse {
  stocks: LineItems<{ goodId: string; quantity: number }>;
}

export interface GetGoodDetailsResponse {
  details: StockDetails;
}

export interface GetWarehouseViewResponse {
  stock: Stock;
}

export interface GetWarehouseViewsResponse {
  stocks: LineItems<Stock>;
}
