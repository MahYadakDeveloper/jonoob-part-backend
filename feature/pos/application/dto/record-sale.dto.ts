export interface RecordSaleInputDto {
  cashierId: string;
  customerInfo?: {
    id: string;
    useCredit?: true;
  };
  items: {
    productId: string;
    quantity: number;
  }[];
}
