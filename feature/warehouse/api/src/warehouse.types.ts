import { Barcode, UnitOfMeasure } from '@feature/common';

export type Stock = {
  readonly goodId: string;
  readonly barcode: Barcode;
  readonly quantity: number;
  readonly unitOfMeasure?: UnitOfMeasure;
  readonly storageLocation?: string;
};

export type StockDetails = Omit<Stock, 'stock'>;
