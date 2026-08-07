import { LineItems, Money, UnitOfMeasure } from '@feature/common';

export const SupplyRecordedEventType = 'procurement:supply-recorded';
export type SupplyRecordedEventPayload = {
  documentId: string;

  specialistId: string;

  supplier?: {
    id: string;
    displayName: string;
  };
  lines: LineItems<{
    goodId: string;
    unit: UnitOfMeasure;
    quantity: number;
    purchasePrice: Money;
  }>;
};
