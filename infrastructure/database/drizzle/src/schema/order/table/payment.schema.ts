import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { orderSchema } from '../order.schema';
import { orders } from './orders.schema';

export const paymentStatus = orderSchema.enum('payment_status', [
  'pending',
  'paid',
  'failure',
  'expired',
  'refunded',
]);

export const paymentMethod = orderSchema.enum('payment_method', [
  'wallet',
  'gateway',
  'partial',
]);

export const refundType = orderSchema.enum('refund_type', ['full', 'partial']);

export const refundDestination = orderSchema.enum('refund_destination', [
  'wallet',
  'gateway',
  'partial',
]);

export const payments = orderSchema.table(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),

    status: paymentStatus('status').notNull().default('pending'),
    method: paymentMethod('method'),

    amount: bigint('amount', { mode: 'number' }),
    walletAmount: bigint('wallet_amount', { mode: 'number' }),
    gatewayAmount: bigint('gateway_amount', { mode: 'number' }),
    gatewayKey: varchar('gateway_key', { length: 100 }),
    trackingCode: varchar('tracking_code', { length: 200 }),

    paidAt: timestamp('paid_at', { withTimezone: true }),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
    refundType: refundType('refund_type'),
    refundDestination: refundDestination('refund_destination'),
    refundedAmount: bigint('refunded_amount', { mode: 'number' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (t) => [
    index('payments_order_id_idx').on(t.orderId),
    index('payments_status_idx').on(t.status),
    check(
      'payments_amounts_non_negative',
      sql`(${t.amount} IS NULL OR ${t.amount} >= 0)
        AND (${t.walletAmount} IS NULL OR ${t.walletAmount} >= 0)
        AND (${t.gatewayAmount} IS NULL OR ${t.gatewayAmount} >= 0)
        AND (${t.refundedAmount} IS NULL OR ${t.refundedAmount} >= 0)`,
    ),
    check(
      'payments_method_allocation',
      sql`(
        (${t.method} IS NULL AND ${t.amount} IS NULL
          AND ${t.walletAmount} IS NULL AND ${t.gatewayAmount} IS NULL)
        OR (${t.method} = 'wallet' AND ${t.amount} IS NOT NULL
          AND ${t.walletAmount} IS NULL AND ${t.gatewayAmount} IS NULL)
        OR (${t.method} = 'gateway' AND ${t.amount} IS NOT NULL
          AND ${t.walletAmount} IS NULL AND ${t.gatewayAmount} IS NULL
          AND ${t.gatewayKey} IS NOT NULL AND ${t.trackingCode} IS NOT NULL)
        OR (${t.method} = 'partial' AND ${t.amount} IS NULL
          AND ${t.walletAmount} IS NOT NULL AND ${t.gatewayAmount} IS NOT NULL
          AND ${t.gatewayKey} IS NOT NULL AND ${t.trackingCode} IS NOT NULL)
      )`,
    ),
    check(
      'payments_refund_fields',
      sql`(
        (${t.status} = 'refunded' AND ${t.refundedAt} IS NOT NULL
          AND ${t.refundType} IS NOT NULL AND ${t.refundDestination} IS NOT NULL
          AND ((${t.refundType} = 'full' AND ${t.refundedAmount} IS NULL)
            OR (${t.refundType} = 'partial' AND ${t.refundDestination} = 'wallet'
              AND ${t.refundedAmount} IS NOT NULL)))
        OR (${t.status} <> 'refunded' AND ${t.refundedAt} IS NULL
          AND ${t.refundType} IS NULL AND ${t.refundDestination} IS NULL
          AND ${t.refundedAmount} IS NULL)
      )`,
    ),
    check(
      'payments_paid_timestamp',
      sql`(${t.status} = 'paid') = (${t.paidAt} IS NOT NULL)`,
    ),
  ],
);
