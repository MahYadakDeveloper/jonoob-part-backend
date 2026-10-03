import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { warehouseSchema } from '../warehouse.schema';
import { stocks } from './stocks.schema';

export const reservations = warehouseSchema.table('reservations', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  idempotencyKey: text('idempotency_key').unique().notNull(),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const reservationItems = warehouseSchema.table(
  'reservation_items',
  {
    reservationId: uuid('reservation_id')
      .notNull()
      .references(() => reservations.id, { onDelete: 'cascade' }),
    stockId: uuid('stock_id')
      .notNull()
      .references(() => stocks.id),
    quantity: integer('quantity').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.reservationId, t.stockId] }),
    index('idx_reservation_items_stock').on(t.stockId),
    check('reservation_items_qty_positive', sql`${t.quantity} > 0`),
  ],
);
