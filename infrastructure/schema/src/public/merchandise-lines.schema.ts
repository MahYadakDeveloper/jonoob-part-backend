import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
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

export const createMerchandiseLine = <N extends string>(
  name: N,
  parent: () => AnyPgColumn,
) =>
  pgTable(
    name,
    {
      id: uuid('id').primaryKey().defaultRandom(),

      // خط سطح بالا: به والد وصل است
      referenceId: uuid('reference_id').references(parent, {
        onDelete: 'cascade',
      }),

      // خط فرزند: به bundle وصل است
      bundleId: uuid('bundle_id'),

      kind: merchandiseLineKind('kind').notNull(),
      position: integer('position').notNull().default(0),

      productId: uuid('product_id').notNull(),
      displayName: text('display_name').notNull(),
      quantity: integer('quantity').notNull(),
      unitPrice: money('unit_price').notNull(),
      lineTotal: money('line_total').notNull(),

      stockId: uuid('stock_id'),

      discount: jsonb('discount').$type<MerchandiseLineDiscount>(),
    },
    (t) => [
      foreignKey({
        name: `${name}_bundle_fk`,
        columns: [t.bundleId],
        foreignColumns: [t.id],
      }).onDelete('cascade'),

      index(`${name}_reference_idx`).on(t.referenceId),
      index(`${name}_bundle_idx`).on(t.bundleId),

      check(
        `${name}_single_owner`,
        sql`num_nonnulls(${t.referenceId}, ${t.bundleId}) = 1`,
      ),
      check(
        `${name}_stock_only_for_leaf`,
        sql`${t.stockId} IS NULL OR ${t.kind} = 'leaf'`,
      ),
      check(
        `${name}_child_is_plain`,
        sql`${t.bundleId} IS NULL OR (${t.kind} = 'leaf' AND ${t.discount} IS NULL)`,
      ),
      check(
        `${name}_discount_is_object`,
        sql`${t.discount} IS NULL OR jsonb_typeof(${t.discount}) = 'object'`,
      ),
      check(`${name}_positive_quantity`, sql`${t.quantity} > 0`),
      check(
        `${name}_non_negative_money`,
        sql`${t.unitPrice} >= 0 AND ${t.lineTotal} >= 0`,
      ),
    ],
  );
