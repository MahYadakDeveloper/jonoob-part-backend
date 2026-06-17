export interface RecordGoodsIssueInputDto {
  items: {
    goodsId: string;
    qty: number;
  }[];
}
