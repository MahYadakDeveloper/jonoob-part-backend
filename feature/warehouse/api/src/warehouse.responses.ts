import { LineItems } from "@feature/common";
import { Good, GoodDetails } from "./warehouse.types";

export interface GoodIdResolvingResponse {
  goodId: string;
}

export interface GetStockResponse {
  stock: number;
}

export interface GetStocksResponse {
  stocks: LineItems<{ goodId: string; stock: number }>;
}

export interface GetGoodDetailsResponse {
  details: GoodDetails;
}

export interface GetWarehouseViewResponse {
  good: Good;
}

export interface GetWarehouseViewsResponse {
  goods: LineItems<Good>;
}
