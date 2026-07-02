export interface FindApplicableDiscountRequest {
  item: { productId: string; quantity: number };
  customerId?: string;
}
export interface FindManyApplicableDiscountRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  customerId?: string;
}


