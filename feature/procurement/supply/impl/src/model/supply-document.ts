import { Barcode, LineItems, Money, UnitOfMeasure } from '@feature/common';

export interface SupplyDocument<LineRefs extends string | Barcode> {
  id: string;

  specialistId: string;

  supplier: {
    id: string;
    displayName: string;
  };

  suppliedAt: Date;

  lines: LineItems<SupplyDocumentLine<LineRefs>>;

  // It's not required to be persisted, because it's computational
  // grandTotal: Money;
}

type SupplyDocumentLine<Ref extends string | Barcode> = {
  reference: Ref;

  quantity: number;

  unit: UnitOfMeasure;

  purchasePrice: Money;

  // It's not required to be persisted, because it's computational
  // lineTotal: Money;
};
