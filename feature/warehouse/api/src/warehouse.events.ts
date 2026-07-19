export const GoodsIssuedEventType = "warehouse.goods-issued";
export const GoodsReceiptedEventType = "warehouse.goods-receipted";

export interface GoodsIssuedEventPayload {
  goodIds: string[];
}

export interface GoodsReceiptedEventPayload {
  goodIds: string[];
}
