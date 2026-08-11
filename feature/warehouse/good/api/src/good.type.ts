import { Barcode, UnitOfMeasure } from '@feature/common';

export type Good = {
  readonly goodId: string;
  readonly barcode: Barcode;
  readonly unitOfMeasure?: UnitOfMeasure;
  readonly storageLocation?: string;
};
