export interface AvailableStockRequest {
  goodId: string;
}

export interface StockAdjustmentRequest {
  goodId: string;
  stock: number;
}

export interface AvailableStocksRequest {
  goodIds: string[];
}

export interface GoodsReceptionRequest {
  items: { goodId: string; quantity: number }[];
}
