import { sql } from 'drizzle-orm';
import { check, index, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { orderSchema } from './order.schema';
import { orders } from './orders.schema';

export const fulfillmentStatus = orderSchema.enum('fulfillment_status', [
  'pending',
  'processing',
  'fulfilled',
  'canceled_by_customer',
  'canceled_by_manager',
]);

export const fulfillments = orderSchema.table(
  'fulfillments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .unique('fulfillments_order_unique')
      .references(() => orders.id, { onDelete: 'cascade' }),

    // reservation is referenced by the id
    // reservationId: uuid('reservation_id').references(() => reservations.id, {
    //   onDelete: 'set null',
    // }),

    status: fulfillmentStatus('status').notNull().default('pending'),
    cancellationReason: text('cancellation_reason'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (t) => [
    index('fulfillments_status_idx').on(t.createdAt.desc(), t.status),

    check(
      'fulfillments_manager_cancel_requires_reason',
      sql`${t.status} <> 'canceled_by_manager' OR (${t.cancellationReason} IS NOT NULL AND length(btrim(${t.cancellationReason})) > 0)`,
    ),
    check(
      'fulfillments_cancellation_reason_not_blank',
      sql`${t.cancellationReason} IS NULL OR length(btrim(${t.cancellationReason})) > 0`,
    ),
  ],
);
