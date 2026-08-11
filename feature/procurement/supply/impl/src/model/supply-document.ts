import { LineItems, Money } from '@feature/common';

export interface SupplyDocument {
  id: string;

  specialistId: string;

  supplier: {
    id: string;
    displayName: string;
    contactNumbers: string[];
    address?: string;
  };

  suppliedAt: Date;
  updatedAt?: Date;

  lines: LineItems<SupplyDocumentLine>;

  // It's not required to be persisted, because it's computational
  // grandTotal: Money;
}

export type SupplyDocumentLine = {
  goodId: string;

  quantity: number;

  purchasePrice: Money;

  // It's not required to be persisted, because it's computational
  // lineTotal: Money;
};
