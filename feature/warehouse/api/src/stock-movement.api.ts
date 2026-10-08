import {
  IssueMovementSource,
  MovementItem,
  ReceiptMovementSource,
  ReturnMovementItem,
  ReturnMovementSource,
} from './warehouse.type';

export const STOCK_MOVEMENT_API = Symbol('StockMovementApi');
export interface StockMovementApi {
  issue(input: {
    items: MovementItem[];
    source: IssueMovementSource;
    idempotencyKey: string;
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
