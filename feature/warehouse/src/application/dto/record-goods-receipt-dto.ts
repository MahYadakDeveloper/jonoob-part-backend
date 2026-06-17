export interface RecordGoodsReceiptInputDto {
  items: { goodsId: string; qty?: number }[];
}
