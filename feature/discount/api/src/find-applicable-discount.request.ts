export interface FindApplicableDiscountRequest {
  item: { productId: string; quantity: number };
  customerId?: string;
}
