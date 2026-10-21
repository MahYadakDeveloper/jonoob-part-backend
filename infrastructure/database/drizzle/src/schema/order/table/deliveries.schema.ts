import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  jsonb,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { addresses, couriers } from '../../actors/tables';
import { orderSchema } from '../order.schema';
import { orders } from './orders.schema';

type DeliveryScope = (typeof deliveryScope.enumValues)[number];

type DeliveryRecipient = {
  contact: {
    fullName: string;
    phone: string;
  };
  address: typeof addresses.$inferSelect;
};

export const deliveryStatus = orderSchema.enum('delivery_status', [
  'pending',
  'courier_requested',
  'canceled',
  'handed_over_to_courier',
  'delivered',
  'returned_to_warehouse',
]);

export const deliveryScope = orderSchema.enum('address_scope', [
  'intra_city',
  'inter_city',
]);

export const intraCityDeliveryFailureReasons = orderSchema.enum(
  'intra_city_delivery_failure_reasons',
  [
    'recipient_absent',
    'recipient_unreachable',
    'invalid_address',
    'recipient_refused',
    'other',
  ],
);

export const deliveryAttemptFailures = orderSchema.table(
  'delivery_attempt_failures',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    deliveryId: uuid('delivery_id').notNull(),

    // Mirrors deliveries.scope through the composite foreign key.
    scope: varchar('scope', { length: 16 }).$type<DeliveryScope>().notNull(),

    reason: intraCityDeliveryFailureReasons('reason'),

    reasonMessage: text('reason_message'),

    reportedAt: timestamp('reported_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    foreignKey({
      name: 'delivery_attempt_failures_delivery_scope_fk',
      columns: [t.deliveryId, t.scope],
      foreignColumns: [deliveries.id, deliveries.scope],
    }).onDelete('cascade'),

    check(
      'delivery_attempt_failures_scope_check',
      sql`${t.scope} IN ('intra_city', 'inter_city')`,
    ),

    check(
      'delivery_attempt_failures_reason_consistency',
      sql`
        (
          ${t.scope} = 'intra_city'
          AND (
            (
              ${t.reason} = 'other'
              AND ${t.reasonMessage} IS NOT NULL
            )
            OR (
              ${t.reason} IS NOT NULL
              AND ${t.reason} <> 'other'
              AND ${t.reasonMessage} IS NULL
            )
          )
        )
        OR (
          ${t.scope} = 'inter_city'
          AND ${t.reason} IS NULL
          AND ${t.reasonMessage} IS NOT NULL
        )
      `,
    ),
  ],
);

export const deliveries = orderSchema.table(
  'deliveries',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),

    status: deliveryStatus('status').notNull().default('pending'),

    recipient: jsonb('recipient').$type<DeliveryRecipient>().notNull(),

    scope: deliveryScope('delivery_scope').notNull(),

    courierId: uuid('courier_id').references(() => couriers.id, {
      onDelete: 'set null',
    }),

    confirmationCode: varchar('delivery_confirmation_code', {
      length: 6,
    }),

    freight: varchar('freight', {
      length: 64,
    }),
    trackingNumber: varchar('tracking_number', { length: 128 }),

    requestedAt: timestamp('requested_at', { withTimezone: true }),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
    handedOverAt: timestamp('handed_over_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    returnedAt: timestamp('returned_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (t) => [
    unique('deliveries_id_scope_unique').on(t.id, t.scope),
    index('deliveries_order_id_idx').on(t.orderId),
    index('deliveries_status_idx').on(t.status),
    index('deliveries_courier_id_idx').on(t.courierId),

    check(
      'deliveries_scope_fields',
      sql`CASE
        WHEN ${t.scope} = 'intra_city'
        THEN ${t.freight} IS NULL
          AND ${t.trackingNumber} IS NULL
          AND (
            ${t.status} NOT IN (
              'handed_over_to_courier',
              'delivered',
              'returned_to_warehouse'
            )
            OR ${t.confirmationCode} IS NOT NULL
          )
        WHEN ${t.scope} = 'inter_city'
        THEN ${t.freight} IS NOT NULL
          AND ${t.confirmationCode} IS NULL
          AND (
            (${t.status} = 'delivered' AND ${t.trackingNumber} IS NOT NULL)
            OR (${t.status} <> 'delivered' AND ${t.trackingNumber} IS NULL)
          )
        ELSE FALSE
      END`,
    ),
    check(
      'deliveries_status_fields',
      sql`(
        (${t.status} = 'pending'
          AND ${t.courierId} IS NULL)
        OR (${t.status} = 'courier_requested'
          AND ${t.requestedAt} IS NOT NULL AND ${t.courierId} IS NULL)
        OR (${t.status} = 'canceled'
          AND ${t.canceledAt} IS NOT NULL)
        OR (${t.status} = 'handed_over_to_courier'
          AND ${t.courierId} IS NOT NULL AND ${t.handedOverAt} IS NOT NULL)
        OR (${t.status} = 'delivered'
          AND ${t.courierId} IS NOT NULL AND ${t.deliveredAt} IS NOT NULL)
        OR (${t.status} = 'returned_to_warehouse'
          AND ${t.courierId} IS NOT NULL AND ${t.returnedAt} IS NOT NULL)
      )`,
    ),
  ],
);
