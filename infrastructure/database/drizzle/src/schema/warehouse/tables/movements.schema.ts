import { AnyPgColumn, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { warehouseSchema } from '../warehouse.schema';

type MovementSource =
  | ({ direction: 'outbound' } & (
      | { type: 'adjustment'; reason?: string }
      | {
          type: 'reversal';
          boundary: 'pos' | 'order';
        }
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
        ))
    ))
  | ({ direction: 'outbound' } & (
      | { type: 'adjustment'; reason?: string }
      | {
          referenceId: string;
          type: 'sales';
          boundary: 'pos' | 'order';
        }
      | {
          type: 'reversal';
          boundary: 'supply';
        }
    ));

export const movements = warehouseSchema.table('movements', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  idempotencyKey: text('idempotency_key').unique().notNull(),

  items: jsonb('items')
    .$type<{ stockId: string; quantity: number }[]>()
    .notNull(),

  details: jsonb('details').$type<MovementSource>().notNull(),

  reversesId: uuid('reverses_id')
    .unique()
    .references((): AnyPgColumn => movements.id),

  recordedAt: timestamp('recorded_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
