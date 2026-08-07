import { Money } from '@feature/common';

type PurchaseRecordBase = {
  id: string;
  goodId: string;

  recordedAt: Date;

  specialistId: string;

  supplier?: {
    id: string;
    displayName: string;
  };

  purchasePrice: Money;
};

export type PurchaseRecord =
  | ({
      type: 'supply';

      quantity: number;

      unit?: string;

      documentId?: string;
    } & PurchaseRecordBase)
  | ({
      type: 'quote';
    } & PurchaseRecordBase);

// [TODO]
// model SupplyRecord {
//   id String @id @default(cuid())

//   goodId String

//   suppliedAt DateTime

//   supplierId          String?
//   supplierDisplayName String?

//   quantity Decimal
//   unit     String?

//   purchasePriceAmount   Decimal
//   purchasePriceCurrency String

//   documentId String?

//   @@index([goodId, suppliedAt(sort: Desc)])
// }

export type CreatePurchaseRecordData<T extends PurchaseRecord['type']> = Omit<
  Extract<PurchaseRecord, { type: T }>,
  'id' | 'recordedAt' | 'type'
>;
