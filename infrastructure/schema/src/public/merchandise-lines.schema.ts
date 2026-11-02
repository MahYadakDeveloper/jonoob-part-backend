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
  'product',
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

      referenceId: uuid('reference_id').references(parent, {
        onDelete: 'cascade',
      }),

      bundleId: uuid('bundle_id'),

      kind: merchandiseLineKind('kind').notNull(),
      position: integer('position').notNull().default(0),

      // The catalog item that was sold (a product or a bundle).
      catalogItemId: uuid('catalog_item_id').notNull(),
      displayName: text('display_name').notNull(),
      quantity: integer('quantity').notNull(),
      unitPrice: money('unit_price').notNull(),
      lineTotal: money('line_total').notNull(),

      // The product behind a 'product' line. Always NULL for bundle lines.
      productId: uuid('product_id'),

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
        `${name}_product_id_only_for_product`,
        sql`${t.productId} IS NULL OR ${t.kind} = 'product'`,
      ),
      check(
        `${name}_child_is_plain`,
        sql`${t.bundleId} IS NULL OR (${t.kind} = 'product' AND ${t.discount} IS NULL)`,
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
