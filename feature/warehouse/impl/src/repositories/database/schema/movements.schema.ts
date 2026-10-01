import { inArray } from 'drizzle-orm';
import { unique, uuid } from 'drizzle-orm/cockroach-core';
import {
  AnyPgColumn,
  check,
  jsonb,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { warehouseSchema } from './warehouse.schema';

// id               uuid PRIMARY KEY,
// operation        text NOT NULL,
// idempotency_key  text NOT NULL,
// request_hash     text NOT NULL,

// direction        text NOT NULL CHECK (direction IN ('inbound','outbound')),
// source_type      text NOT NULL CHECK (source_type IN ('procurement','return','sales','adjustment')),
// boundary         text CHECK (boundary IN ('supply','pos','order')),
// reference_id     text,
// reason           text,

export const movements = warehouseSchema.table(
  'movements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    idempotencyKey: uuid('idempotency_key').notNull(),

    items: jsonb('items')
      .$type<
        {
          stockId: string;
          quantity: number;
        }[]
      >()
      .notNull(),

    direction: varchar('direction').notNull(),
    sourceType: varchar('source_type').notNull(),
    sourceBoundary: varchar('source_boundary'),
    referenceId: uuid('reference_id'),
    reason: text('reason'),

    reversesId: uuid('reverses_id')
      .unique()
      .references((): AnyPgColumn => movements.id),

    recordedAt: timestamp('recorded_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique('uq_stock_movement_idem').on(t.sourceBoundary, t.idempotencyKey),
    check('chk_direction', inArray(t.direction, ['inbound', 'outbound'])),
    check(
      'chk_source_type',
      inArray(t.sourceType, ['adjustment', 'procurement', 'sales', 'return']),
    ),
    check(
      'chk_source_boundary',
      inArray(t.sourceBoundary, ['order', 'supply', 'pos']),
    ),
  ],
);
