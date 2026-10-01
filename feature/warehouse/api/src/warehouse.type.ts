import { Barcode, UnitOfMeasure } from '@feature/common';

export type StockItems = { stockId: string; quantity: number };

export type IssueMovementSource = OutboundMovementSource['source'];

export type ReceiptMovementSource = Extract<
  InboundMovementSource['source'],
  { type: 'procurement' }
>;

export type ReturnMovementSource = Extract<
  InboundMovementSource['source'],
  { type: 'return' }
>;

export type InboundMovementSource = {
  source:
    | { type: 'adjustment'; reason?: string }
    | ({
        referenceId?: string;
      } & (
        | {
            type: 'procurement';
            boundary: 'supply';
          }
        | {
            type: 'return';
            boundary: 'pos' | 'order';
          }
      ));
};

export type OutboundMovementSource = {
  source:
    | { type: 'adjustment'; reason?: string }
    | {
        referenceId: string;
        type: 'sales';
        boundary: 'pos' | 'order';
      };
};

export type Stock = {
  id: string;
  quantity: number;
  barcode: Barcode;
  unitOfMeasure: UnitOfMeasure;
  storageLocation?: string;
};
