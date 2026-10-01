import { Barcode, UnitOfMeasure } from '@feature/common';

export type StockMovementItem = { stockId: string; quantity: number };

export type IssueMovementSource = Extract<
  OutboundStockMovement['source'],
  { type: 'sales' }
>;

export type ReceiptMovementSource = Extract<
  InboundStockMovement['source'],
  { type: 'procurement' }
>;

export type ReturnMovementSource = Extract<
  InboundStockMovement['source'],
  { type: 'return' }
>;

export type InboundStockMovement = {
  id: string;
  movedAt: number;
  direction: 'inbound';
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

export type OutboundStockMovement = {
  id: string;
  movedAt: number;
  direction: 'outbound';
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
