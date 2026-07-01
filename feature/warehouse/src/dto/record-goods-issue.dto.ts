export interface RecordGoodsIssueInputDto {
  items: {
    goodId: string;
    qty: number;
  }[];
}
