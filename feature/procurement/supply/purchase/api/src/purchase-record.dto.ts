import { Money } from '@feature/common';

export interface PurchaseRecordDto {
  id: string;

  goodId: string;
  recordedAt: Date;

  purchasePrice: Money;
}

export interface NewSuppliedPurchaseRecordDto {
  goodId: string;

  specialistId: string;

  supplier?: {
    id: string;
    displayName: string;
  };

  purchasePrice: Money;

  documentId: string;
}
