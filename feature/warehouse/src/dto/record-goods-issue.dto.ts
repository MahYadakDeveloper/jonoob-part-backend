export interface RecordGoodsIssueRequest {
  items: {
    goodId: string;
    qty: number;
  }[];
}
