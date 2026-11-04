import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { products } from '../catalog/products.schema';
import { shelves } from './shelves.schema';
import { warehouseSchema } from './warehouse.schema';

export const STOCK_CONSTRAINTS = {
  quantityNonNegative: 'stocks_quantity_non_negative_chk',
} as const;

// One row per (product, shelf). A stock always sits on a shelf, and the
// warehouse (or the storeroom) is whatever that shelf belongs to.
export const stocks = warehouseSchema.table(
  'stocks',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    shelfId: uuid('shelf_id')
      .notNull()
      .references(() => shelves.id, { onDelete: 'restrict' }),

    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),

    // Quantity on THIS shelf. A row never rests at 0: the trigger
    // stocks_delete_when_empty removes it as soon as it reaches 0.
    quantity: integer('quantity').notNull(),

    // Start of the current stocking period on this shelf. Rows are deleted at
    // zero, so a re-stocked shelf gets a fresh value.
    stockedSince: timestamp('stocked_since', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique('stocks_product_shelf_uq').on(t.productId, t.shelfId),
    // >= 0 (not > 0): a decrement may touch 0 for an instant before the
    // trigger deletes the row.
    check(STOCK_CONSTRAINTS.quantityNonNegative, sql`${t.quantity} >= 0`),

    // FK child lookup (deleting a shelf) and "what is on this shelf".
    index('stocks_shelf_idx').on(t.shelfId),
  ],
);
