export interface FindApplicableDiscountRequest {
  productId: string;
  purchasedQty: number;
  customerId?: string;
}
