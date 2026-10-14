import { CustomerAddress } from '@feature/shared/types/customer-address';
import { CustomerType } from '@feature/shared/types/customer-type';
import { sql } from 'drizzle-orm';
import { check, index, jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';
import { couriers } from '../../actors/tables';
import { orderSchema } from '../order.schema';
import { orders } from './orders.schema';

export type IntraCityDeliveryFailureReasonType =
  | {
      reason:
        | 'recipient_absent'
        | 'recipient_unreachable'
        | 'invalid_address'
        | 'recipient_refused';
    }
  | {
      reason: 'other';
      message: string;
    };

// Persisted shape; the status-specific narrowing lives in the delivery mapper.
export type DeliveryRecipient = {
  customerContact: {
    fullName: string;
    phone: string;
    type: CustomerType;
  };
} & (
  | (Extract<CustomerAddress, { scope: 'intra_city' }> & {
      deliveryConfirmationCode?: string;
      reason?: string;
      message?: string;
    })
  | (Extract<CustomerAddress, { scope: 'inter_city' }> & {
      carrierKey: string;
      trackingNumber?: string;
      reasonMessage?: string;
    })
);

export const deliveryStatus = orderSchema.enum('delivery_status', [
  'initial',
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

    status: deliveryStatus('status').notNull().default('initial'),

    // Shape depends on status and recipient scope; see the Delivery type.
    recipient: jsonb('recipient').$type<DeliveryRecipient>().notNull(),

    courierId: uuid('courier_id').references(() => couriers.id),

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
      'deliveries_status_fields',
      sql`(
        (${t.status} = 'initial'
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

export type DeliveryRow = typeof deliveries.$inferSelect;
export type NewDeliveryRow = typeof deliveries.$inferInsert;
