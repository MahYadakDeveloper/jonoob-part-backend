export type MovementItem = { stockId: string; quantity: number };

export type ReturnReason =
  | 'changed_mind'
  | 'wrong_item'
  | 'defective'
  | 'damaged'
  | 'not_as_described'
  | 'other';

export type ReturnMovementItem = {
  stockId: string;
} & (
  | {
      packaging: 'sealed';
      reason: Exclude<ReturnReason, 'damaged' | 'defective'>;
    }
  | {
      packaging: 'opened';
      reason: ReturnReason;
      note?: string;
    }
);

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
        referenceId: string;
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

export interface BaseStockMovementInput {
  idempotencyKey: string;
  items: MovementItem[];
}

export interface IssueMovementInput extends BaseStockMovementInput {
  source: IssueMovementSource;
}

export interface ReceiptMovementInput extends BaseStockMovementInput {
  source: ReceiptMovementSource;
}

export interface ReturnMovementInput extends BaseStockMovementInput {
  source: ReturnMovementSource;
}

export const STOCK_MOVEMENT_API = Symbol('STOCK_MOVEMENT_API');

export interface StockMovementApi {
  issue(input: {
    source: IssueMovementSource;
  }): Promise<{ movementId: string }>;

  receipt(input: {
    items: MovementItem[];
    source: ReceiptMovementSource;
    idempotencyKey: string;
  }): Promise<{ movementId: string }>;

  return(input: {
    items: ReturnMovementItem[];
    source: ReturnMovementSource;
    idempotencyKey: string;
  }): Promise<{ movementId: string }>;

  /**
   * Undoes the stock effects of a movement and permanently removes its record.
   * Fails if the movement is referenced elsewhere (e.g. by a quarantine).
   */
  undo(input: { movementId: string }): Promise<void>;
}
