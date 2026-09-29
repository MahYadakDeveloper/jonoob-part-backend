import { Barcode, UnitOfMeasure } from '@feature/common';

export interface StockMovement {
  id: string;
  movedAt: number;
  type: 'issue' | 'receipt' | 'return'; // 'transfer';
  ref?: string;
}

export type Stock = {
  id: string;
  quantity: number;
  barcode: Barcode;
  unitOfMeasure: UnitOfMeasure;
  storageLocation?: string;
};
