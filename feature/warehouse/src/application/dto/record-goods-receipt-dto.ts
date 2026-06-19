export interface RecordGoodsReceiptInputDto {
  items: { goodId: string; qty?: number }[];
}
