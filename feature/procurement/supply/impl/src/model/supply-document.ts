import { LineItems, Money, UnitOfMeasure } from '@feature/common';

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

  lines: LineItems<SupplyDocumentLine>;

  // It's not required to be persisted, because it's computational
  // grandTotal: Money;
}

type SupplyDocumentLine = {
  goodId: string;

  quantity: number;

  unit: UnitOfMeasure;

  purchasePrice: Money;

  // It's not required to be persisted, because it's computational
  // lineTotal: Money;
};
