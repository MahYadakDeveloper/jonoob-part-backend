export const IssuedEventType = 'warehouse.goods-issued';
export const StocksReceiptedEventType = 'warehouse.goods-receipted';

export interface GoodsIssuedEventPayload {
  goodIds: string[];
}

export interface GoodsReceiptedEventPayload {
  goodIds: string[];
}
