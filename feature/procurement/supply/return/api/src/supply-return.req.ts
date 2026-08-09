import { LineItems } from '@feature/common';

export interface RecordSupplyReturnRequest {
  specialistId: string;
  supplierId: string;
  item: LineItems<{ goodId: string; quantity: number }>;
}
