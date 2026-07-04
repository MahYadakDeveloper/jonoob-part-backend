export interface RecordReturnInput {
  saleId: string;
  items:
    | "whole"
    | {
        productId: string;
        quantity: number;
      }[];
  discardCashbackReversal?: true | false
}
