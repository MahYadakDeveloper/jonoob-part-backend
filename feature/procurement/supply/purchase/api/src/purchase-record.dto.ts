import { Money } from '@feature/common';

export interface PurchaseRecordDto {
  id: string;

  goodId: string;
  recordedAt: Date;

  purchasePrice: Money;
}
