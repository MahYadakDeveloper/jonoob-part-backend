export interface GrantCashbackRequest {
  customerId: string;
  purchasedItems: { productId: string; quantity: number }[];
}
