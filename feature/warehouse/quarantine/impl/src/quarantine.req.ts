import { LineItems } from '@feature/common';

export interface ReleaseStockRequest {
  items: LineItems<{ stockId: string; qty: number }>;
}

export interface ReturnToSupplierRequest {
  specialistId: string;
  supplierId: string;
  items: LineItems<{ stockId: string; qty: number }>;
}
