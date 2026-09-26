export interface QuarantineStockRequest {
  referenceId: string;
  reason: 'customer_return';
  items: { stockId: string; qty: number }[];
}
