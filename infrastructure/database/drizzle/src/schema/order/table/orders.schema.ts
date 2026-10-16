import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  jsonb,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { customers } from '../../actors/tables';
import { orderSchema } from '../order.schema';

export const cancellationFeeType = orderSchema.enum('cancellation_fee_type', [
  'fixed',
  'rate',
]);

export const orderSummary = orderSchema.table(
  'order_summary',
  {
    orderId: uuid().references(() => orders.id, { onDelete: 'cascade' }),
    subtotal: bigint('subtotal', { mode: 'number' }).notNull(),
    discountTotal: bigint('discount_total', { mode: 'number' })
      .notNull()
      .default(0),
    taxTotal: bigint('tax_total', { mode: 'number' }).notNull().default(0),
    grandTotal: bigint('grand_total', { mode: 'number' }).notNull(),

    cashback: jsonb('cashback').$type<{
      rate: number;
      amount: number;
    }>(),
  },
  (t) => [
    check(
      'orders_amounts_non_negative',
      sql`${t.subtotal} >= 0 AND ${t.discountTotal} >= 0
        AND ${t.taxTotal} >= 0 AND ${t.grandTotal} >= 0`,
    ),
    check(
      'orders_grand_total_balance',
      sql`${t.grandTotal} = ${t.subtotal} - ${t.discountTotal} + ${t.taxTotal}`,
    ),
    check(
      'orders_cashback_fields',
      sql`${t.cashback} IS NULL OR CASE
        WHEN jsonb_typeof(${t.cashback}) = 'object'
        THEN jsonb_typeof(${t.cashback}->'rate') = 'number'
          AND (${t.cashback}->>'rate')::numeric >= 0
          AND jsonb_typeof(${t.cashback}->'amount') = 'number'
          AND (${t.cashback}->>'amount')::numeric >= 0
        ELSE FALSE
      END`,
    ),
  ],
);

// An order is an immutable snapshot of the invoice at the time it was recorded.
// Its lifecycle status is not stored here; it is derived from the payment,
// fulfillment and delivery relations.
export const orders = orderSchema.table(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),

    cancellationFee: jsonb('cancellationTerms')
      .$type<
        | {
            type: 'fixed';
            amount: number;
          }
        | {
            type: 'rate';
            rate: number;
          }
      >()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('orders_customer_id_idx').on(t.customerId),
    index('orders_created_at_idx').on(t.createdAt),
    check(
      'orders_cancellation_fee_fields',
      sql`CASE
        WHEN jsonb_typeof(${t.cancellationFee}) = 'object'
          AND ${t.cancellationFee}->>'type' = 'fixed'
        THEN jsonb_typeof(${t.cancellationFee}->'amount') = 'number'
          AND (${t.cancellationFee}->>'amount')::numeric >= 0
        WHEN jsonb_typeof(${t.cancellationFee}) = 'object'
          AND ${t.cancellationFee}->>'type' = 'rate'
        THEN jsonb_typeof(${t.cancellationFee}->'rate') = 'number'
          AND (${t.cancellationFee}->>'rate')::numeric BETWEEN 0 AND 1
        ELSE FALSE
      END`,
    ),
  ],
);
