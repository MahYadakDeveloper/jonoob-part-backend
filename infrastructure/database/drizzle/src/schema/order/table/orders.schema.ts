import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  doublePrecision,
  index,
  jsonb,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { customers } from '../../actors/tables';
import { orderSchema } from '../order.schema';

// All money values are integer toman, matching the wallet tables.
type Amount = number;

type OrderItemDiscount = {
  discountPerUnit: Amount;
  discountedQuantity: number;
  totalDiscount: Amount;
};

type OrderItemBase = {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: Amount;
  lineTotal: Amount;
};

export type OrderItem =
  | (OrderItemBase & {
      kind: 'leaf';
      discount?: OrderItemDiscount;
    })
  | (OrderItemBase & {
      kind: 'bundle';
      discount?: OrderItemDiscount;
      items: OrderItemBase[];
    });

export const cancellationFeeType = orderSchema.enum('cancellation_fee_type', [
  'fixed',
  'rate',
]);

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

    items: jsonb('items').$type<OrderItem[]>().notNull(),

    subtotal: bigint('subtotal', { mode: 'number' }).notNull(),
    discountTotal: bigint('discount_total', { mode: 'number' })
      .notNull()
      .default(0),
    taxTotal: bigint('tax_total', { mode: 'number' }).notNull().default(0),
    grandTotal: bigint('grand_total', { mode: 'number' }).notNull(),

    cashbackRate: doublePrecision('cashback_rate'),
    cashbackAmount: bigint('cashback_amount', { mode: 'number' }),

    cancellationFeeType: cancellationFeeType('cancellation_fee_type').notNull(),
    cancellationFeeAmount: bigint('cancellation_fee_amount', {
      mode: 'number',
    }),
    cancellationFeeRate: doublePrecision('cancellation_fee_rate'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('orders_customer_id_idx').on(t.customerId),
    index('orders_created_at_idx').on(t.createdAt),
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
      'orders_cashback_pair',
      sql`(${t.cashbackRate} IS NULL) = (${t.cashbackAmount} IS NULL)
        AND (${t.cashbackRate} IS NULL
          OR (${t.cashbackRate} >= 0 AND ${t.cashbackAmount} >= 0))`,
    ),
    check(
      'orders_cancellation_fee_fields',
      sql`(
        (${t.cancellationFeeType} = 'fixed'
          AND ${t.cancellationFeeAmount} >= 0
          AND ${t.cancellationFeeRate} IS NULL)
        OR (${t.cancellationFeeType} = 'rate'
          AND ${t.cancellationFeeRate} BETWEEN 0 AND 1
          AND ${t.cancellationFeeAmount} IS NULL)
      )`,
    ),
    check('orders_items_is_array', sql`jsonb_typeof(${t.items}) = 'array'`),
  ],
);

export type OrderRow = typeof orders.$inferSelect;
