export interface FindApplicableDiscountsRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  customerId?: string;
}
