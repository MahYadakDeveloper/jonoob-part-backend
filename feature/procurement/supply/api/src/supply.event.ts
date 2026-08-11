import { LineItems, Money } from '@feature/common';

export const SupplyRecordedEventType = 'procurement:supply-recorded';
export const SupplyRecordRemovedEventType = 'procurement:supply-record-removed';
export type SupplyRecordEventPayload = {
  documentId: string;

  specialistId: string;

  supplier?: {
    id: string;
    displayName: string;
  };
  lines: LineItems<{
    goodId: string;
    quantity: number;
    purchasePrice: Money;
  }>;
};
