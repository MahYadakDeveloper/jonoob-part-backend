import { sql } from 'drizzle-orm';
import {
  check,
  index,
  jsonb,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { addresses, couriers, customerType } from '../../actors/tables';
import { orderSchema } from '../order.schema';
import { orders } from './orders.schema';

type CustomerType = (typeof customerType.enumValues)[number];
type CustomerAddressBase = Omit<
  typeof addresses.$inferSelect,
  'scope' | 'provinceId' | 'postalCode' | 'latitude' | 'longitude'
>;
type CustomerAddress = CustomerAddressBase &
  (
    | {
        scope: 'inter_city';
        provinceId: number;
        postalCode: string;
      }
    | {
        scope: 'intra_city';
        provinceId: number;
        latitude: number | null;
        longitude: number | null;
      }
  );

type DeliveryRecipient = {
  customerContact: {
    fullName: string;
    phone: string;
    type: CustomerType;
  };
} & CustomerAddress;

export const deliveryStatus = orderSchema.enum('delivery_status', [
  'pending',
  'courier_requested',
  'canceled',
  'handed_over_to_courier',
  'delivered',
  'returned_to_warehouse',
]);

export const deliveries = orderSchema.table(
  'deliveries',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),

    status: deliveryStatus('status').notNull().default('pending'),

    recipient: jsonb('recipient').$type<DeliveryRecipient>().notNull(),

    courierId: uuid('courier_id').references(() => couriers.id, {
      onDelete: 'set null',
    }),

    deliveryConfirmationCode: varchar('delivery_confirmation_code', {
      length: 6,
    }),

    carrierKey: varchar('carrier_key', {
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
    index('deliveries_order_id_idx').on(t.orderId),
    index('deliveries_status_idx').on(t.status),
    index('deliveries_courier_id_idx').on(t.courierId),
    check(
      'deliveries_returned_intra_city_failure_reason',
      sql`CASE
        WHEN ${t.status} = 'returned_to_warehouse'
          AND ${t.recipient}->>'scope' = 'intra_city'
        THEN COALESCE(
          (
            ${t.recipient}->>'reason' IN (
              'recipient_absent',
              'recipient_unreachable',
              'invalid_address',
              'recipient_refused'
            )
            OR (
              ${t.recipient}->>'reason' = 'other'
              AND jsonb_typeof(${t.recipient}->'message') = 'string'
            )
          ),
          FALSE
        )
        ELSE TRUE
      END`,
    ),
    check(
      'deliveries_scope_fields',
      sql`CASE
        WHEN ${t.recipient}->>'scope' = 'intra_city'
        THEN ${t.carrierKey} IS NULL
          AND ${t.trackingNumber} IS NULL
          AND (
            ${t.status} NOT IN (
              'handed_over_to_courier',
              'delivered',
              'returned_to_warehouse'
            )
            OR ${t.deliveryConfirmationCode} IS NOT NULL
          )
        WHEN ${t.recipient}->>'scope' = 'inter_city'
        THEN ${t.carrierKey} IS NOT NULL
          AND ${t.deliveryConfirmationCode} IS NULL
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
