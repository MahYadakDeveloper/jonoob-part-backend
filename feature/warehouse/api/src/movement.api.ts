import { RequiredBy, StrictOmit } from '@feature/shared/types/utils';
import { movementItems, movements } from '@feature/warehouse-schema';

type MovementItem = StrictOmit<typeof movementItems.$inferSelect, 'movementId'>;

type MovementSource = (typeof movements.source.enumValues)[number];

interface MovementInput<S extends MovementSource> extends StrictOmit<
  RequiredBy<typeof movements.$inferInsert, 'referenceId'>,
  'id' | 'movedAt' | 'direction' | 'source'
> {
  source: S;
}

export interface IssueMovementInput extends MovementInput<'order' | 'sale'> {
  items: MovementItem[];
}

export interface ReceiptMovementInput extends MovementInput<'procurement'> {
  items: MovementItem[];
}

export interface ReturnMovementInput extends MovementInput<'return'> {
  items: ({ stockId: string } & (
    | {
        quarantine: false;
      }
    | {
        quarantine: true;
        note: string | null;
      }
  ))[];
}

export interface UndoMovementInput {
  movementId: string;
}

// export interface ReturnMovementInput extends MovementInput {
//   items: & {};
// }

export const MOVEMENT_API = Symbol('WAREHOUSE_MOVEMENT_API');
export interface MovementApi {
  issue(input: IssueMovementInput): Promise<{ movementId: string }>;

  receipt(input: ReceiptMovementInput): Promise<{ movementId: string }>;

  return(input: ReturnMovementInput): Promise<{ movementId: string }>;

  /**
   * Undoes the stock effects of a movement and permanently removes its record.
   * Fails if the movement is referenced elsewhere (e.g. by a quarantine).
   */
  undo(input: UndoMovementInput): Promise<void>;
}
