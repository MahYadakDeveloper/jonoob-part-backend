export interface FindApplicableDiscountRequest {
  productId: string;
  customerId: string;
}
export interface FindManyApplicableDiscountRequest {
  productIds: string[];
  customerId: string;
}
