import { Barcode, UnitOfMeasure } from '@feature/common';

export type Stock = {
  id: string;
  qty: number;
  barcode: Barcode;
  unitOfMeasure: UnitOfMeasure;
  storageLocation?: string;
};
