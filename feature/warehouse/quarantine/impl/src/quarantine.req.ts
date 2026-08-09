import { LineItems } from '@feature/common';

export interface ReleaseStockRequest {
  items: LineItems<{ goodId: string; quantity: number }>;
}

export interface ReturnToSupplierRequest {
  items: LineItems<{ goodId: string; quantity: number }>;
}
