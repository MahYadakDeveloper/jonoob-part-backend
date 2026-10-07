import { sql } from 'drizzle-orm';
import { jsonb, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { warehouseSchema } from '../warehouse.schema';

type MovementSource =
  | ({ direction: 'inbound' } & (
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
        ))
    ))
  | ({ direction: 'outbound' } & (
      | { type: 'adjustment'; reason?: string }
      | {
          referenceId: string;
          type: 'sales';
          boundary: 'pos' | 'order';
        }
    ));

export const movements = warehouseSchema.table(
  'movements',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    idempotencyKey: text('idempotency_key').unique().notNull(),

    items: jsonb('items')
      .$type<{ stockId: string; quantity: number }[]>()
      .notNull(),

    source: jsonb('source').$type<MovementSource>().notNull(),

    sourceType: text('source_type').generatedAlwaysAs(sql`source->>'type'`),

    recordedAt: timestamp('recorded_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [unique('movements_id_source_type_unique').on(t.id, t.sourceType)],
);
