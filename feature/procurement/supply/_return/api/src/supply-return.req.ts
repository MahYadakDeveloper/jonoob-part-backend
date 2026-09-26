import { LineItems } from '@feature/common';

export interface RecordSupplyReturnRequest {
  specialistId: string;
  supplierId: string;
  items: LineItems<{ goodId: string; quantity: number }>;
}
