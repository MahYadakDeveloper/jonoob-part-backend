import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { orders } from '../../order/table/orders.schema';
import { sales } from '../../pos/tables/sale.schema';

export type MerchandiseLineDiscount = {
  discountPerUnit: number;
  discountedQuantity: number;
  totalDiscount: number;
};

const money = (name: string) => bigint(name, { mode: 'number' });

export const merchandiseLineKind = pgEnum('merchandise_line_kind', [
  'leaf',
  'bundle',
]);

export const merchandiseLine = pgTable(
  'merchandise_line',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    orderId: uuid('order_id').references(() => orders.id, {
      onDelete: 'cascade',
    }),

    saleId: uuid('sale_id').references(() => sales.id, {
      onDelete: 'cascade',
    }),

    bundleId: uuid('bundle_id'),

    kind: merchandiseLineKind('kind').notNull(),
    position: integer('position').notNull().default(0),

    productId: uuid('product_id').notNull(),
    displayName: text('description').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: money('unit_price').notNull(),
    lineTotal: money('line_total').notNull(),

    stockId: uuid('stock_id'),

    discount: jsonb('discount').$type<MerchandiseLineDiscount>(),
  },
  (t) => [
    foreignKey({
      name: 'merchandise_line_bundle_fk',
      columns: [t.bundleId],
      foreignColumns: [t.id],
    }).onDelete('cascade'),

    index('merchandise_line_bundle_idx').on(t.bundleId),
    index('merchandise_line_order_idx').on(t.orderId),
    index('merchandise_line_sale_idx').on(t.saleId),

    check(
      'merchandise_line_stock_only_for_leaf',
      sql`${t.stockId} IS NULL OR ${t.kind} = 'leaf'`,
    ),
    check(
      'merchandise_lines_single_owner',
      sql`num_nonnulls(${t.orderId}, ${t.saleId}, ${t.bundleId}) = 1`,
    ),
    check(
      'merchandise_line_child_is_plain',
      sql`${t.bundleId} IS NULL OR (${t.kind} = 'leaf' AND ${t.discount} IS NULL)`,
    ),
    check(
      'merchandise_line_discount_only_for_top_level',
      sql`${t.discount} IS NULL OR ${t.bundleId} IS NULL`,
    ),
    check(
      'merchandise_line_discount_is_object',
      sql`${t.discount} IS NULL OR jsonb_typeof(${t.discount}) = 'object'`,
    ),
    check('merchandise_line_positive_quantity', sql`${t.quantity} > 0`),
    check(
      'merchandise_line_non_negative_money',
      sql`${t.unitPrice} >= 0 AND ${t.lineTotal} >= 0`,
    ),
  ],
);
