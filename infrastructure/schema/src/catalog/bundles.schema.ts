import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { catalogSchema } from './catalog.schema';
import { products } from './products.schema';

export const bundles = catalogSchema.table(
  'bundles',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    displayName: text('display_name').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      'bundles_display_name_not_blank',
      sql`char_length(btrim(${t.displayName})) > 0`,
    ),
  ],
);

export const bundleItems = catalogSchema.table(
  'bundle_items',
  {
    bundleId: uuid('bundle_id')
      .notNull()
      .references(() => bundles.id, { onDelete: 'cascade' }),

    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),

    quantity: integer('quantity').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.bundleId, t.productId] }),
    index('bundle_items_product_id_idx').on(t.productId),
    check('bundle_items_quantity_positive', sql`${t.quantity} > 0`),
  ],
);
