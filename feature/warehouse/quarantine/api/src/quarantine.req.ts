import { LineItems } from '@feature/common';

export interface QuarantineStockRequest {
  referenceId?: string;
  reason: 'customer_return';
  items: LineItems<{ goodId: string; quantity: number }>;
}
