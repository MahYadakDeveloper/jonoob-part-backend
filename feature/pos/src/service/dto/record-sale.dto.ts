export interface RecordSaleInput {
  cashierId: string;
  customer?: {
    id: string;
    useCredit?: true;
  };
  items: {
    productId: string;
    quantity: number;
  }[];
}
