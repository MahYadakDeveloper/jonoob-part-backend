import { LineItems } from '@feature/shared';

export interface RecordSupplyReturnRequest {
  specialistId: string;
  supplierId: string;
  items: LineItems<{ goodId: string; quantity: number }>;
}
