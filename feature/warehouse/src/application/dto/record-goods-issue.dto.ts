export interface RecordGoodsIssueInputDTO {
  items: {
    goodsId: string;
    qty: number;
  }[];
}
