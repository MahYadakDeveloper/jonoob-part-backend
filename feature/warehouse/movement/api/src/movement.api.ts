import { StrictOmit } from '@feature/shared/types/utils';
import {
  movementItems,
  movements,
  movementSource,
} from '@infra/schema/warehouse/movements.schema';

type MovementItem = StrictOmit<typeof movementItems.$inferSelect, 'movementId'>;
type MovementSource = (typeof movementSource.enumValues)[number];
type MovementSelect = typeof movements.$inferSelect;
const SOURCE_REFERENCE = {
  order: 'orderId',
  sale: 'saleId',
  procurement: 'procurementId',
  adjustment: 'adjustmentId',
} as const satisfies Record<MovementSource, keyof MovementSelect>;

type SourceReference = typeof SOURCE_REFERENCE;
type ReferenceKey = SourceReference[MovementSource];

export type MovementInput<Source extends MovementSource> = {
  [S in Source]: StrictOmit<MovementSelect, ReferenceKey | 'source'> & {
    source: S;
  } & Record<SourceReference[S], string>;
}[Source];

export type IssueMovementInput = MovementInput<'order' | 'sale'> & {
  items: MovementItem[];
};

export const MOVEMENT_API = Symbol('MOVEMENT_API');

export interface MovementApi {
  adjust();
}
