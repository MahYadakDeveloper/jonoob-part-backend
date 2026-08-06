import { LineItems, Money } from '@feature/common';

export interface SupplyDocument {
  id: string;

  specialistId: string;

  supplier: {
    id: string;
    name: string;
  };

  suppliedAt: Date;

  lines: LineItems<SupplyDocumentLine>;

  grandTotal: Money;
}

type SupplyDocumentLine = {
  goodId: string;

  quantity: number;

  unit?: string;

  purchasePrice: Money;

  lineTotal: Money;
};
