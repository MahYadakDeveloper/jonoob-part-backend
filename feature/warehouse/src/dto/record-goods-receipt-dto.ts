export interface RecordGoodsReceiptRequest {
  items: { goodId: string; qty?: number }[];
}
