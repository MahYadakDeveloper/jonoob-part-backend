import { Barcode, UnitOfMeasure } from '@feature/common';

export type Good = {
  readonly barcode: Barcode;
  readonly unitOfMeasure?: UnitOfMeasure;
  readonly storageLocation?: string;
};
