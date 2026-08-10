import { LineItems } from '@feature/common';

export interface ReleaseStockRequest {
  items: LineItems<{ goodId: string; quantity: number }>;
}

export interface ReturnToSupplierRequest {
  specialistId: string;
  supplierId: string;
  items: LineItems<{ goodId: string; quantity: number }>;
}
