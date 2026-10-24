import { StrictOmit } from '@feature/shared/types/utils';
import { movements } from '@feature/warehouse-schema';

type MovementItem = (typeof movements.$inferSelect.items)[number];

type ReturnReason =
  | 'changed_mind'
  | 'wrong_item'
  | 'defective'
  | 'damaged'
  | 'not_as_described'
  | 'other';

export type ReturnMovementItem =
  | {
      packaging: 'sealed';
      reason: Exclude<ReturnReason, 'damaged' | 'defective'>;
    }
  | {
      packaging: 'opened';
      reason: ReturnReason;
      note?: string;
    };

interface MovementInput extends StrictOmit<
  typeof movements.$inferInsert,
  'id' | 'idempotencyKey' | 'movedAt' | 'direction' | 'items'
> {}

export interface IssueMovementInput extends MovementInput {
  items: MovementItem[];
}

export interface ReceiptMovementInput extends MovementInput {
  items: MovementItem[];
}

// export interface ReturnMovementInput extends MovementInput {
//   items: & {};
// }

export const MOVEMENT_API = Symbol('WAREHOUSE_MOVEMENT_API');
export interface MovementApi {
  issue(input: IssueMovementInput): Promise<{ movementId: string }>;

  receipt(input: ReceiptMovementInput): Promise<{ movementId: string }>;

  // return(input: {
  //   items: ReturnMovementItem[];
  //   source: ReturnMovementSource;
  //   idempotencyKey: string;
  // }): Promise<{ movementId: string }>;

  /**
   * Undoes the stock effects of a movement and permanently removes its record.
   * Fails if the movement is referenced elsewhere (e.g. by a quarantine).
   */
  undo(input: { movementId: string }): Promise<void>;
}
