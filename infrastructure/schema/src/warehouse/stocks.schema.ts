import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { products } from '../catalog/products.schema';
import {
  createLabelTables,
  labelCodeRegExp,
} from '../public/helpers/create-label-table';
import { shelves } from './shelves.schema';
import { warehouseSchema } from './warehouse.schema';
import { warehouses } from './warehouses.schema';

// One row per (product, warehouse, shelf). shelfId NULL = received but not
// shelved yet (a single "unshelved" row per product and warehouse).
export const STOCK_CONSTRAINTS = {
  quantityNonNegative: 'stocks_quantity_non_negative_chk',
} as const;

export const stocks = warehouseSchema.table(
  'stocks',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'restrict' }),

    // NULL = not shelved yet.
    shelfId: uuid('shelf_id'),

    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),

    // Quantity at THIS place. A row never rests at 0: the trigger
    // stocks_delete_when_empty removes it as soon as it reaches 0.
    quantity: integer('quantity').notNull(),

    // Start of the current stocking period at this place. Rows are deleted at
    // zero, so a re-stocked place gets a fresh value.
    stockedSince: timestamp('stocked_since', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique('stocks_product_warehouse_shelf_uq')
      .on(t.productId, t.warehouseId, t.shelfId)
      .nullsNotDistinct(),

    foreignKey({
      name: 'stocks_shelf_warehouse_fk',
      columns: [t.shelfId, t.warehouseId],
      foreignColumns: [shelves.id, shelves.warehouseId],
    }).onDelete('restrict'),

    // >= 0 (not > 0): a decrement may touch 0 for an instant before the
    // trigger deletes the row.
    check(STOCK_CONSTRAINTS.quantityNonNegative, sql`${t.quantity} >= 0`),

    index('stocks_warehouse_idx').on(t.warehouseId),
    index('stocks_shelf_idx')
      .on(t.shelfId)
      .where(sql`${t.shelfId} IS NOT NULL`),
  ],
);

const STOCK_LABEL_PREFIX = 'S';

export const {
  counter: _,
  freeSeqs: __,
  labels: stockLabels,
} = createLabelTables(warehouseSchema, stocks, STOCK_LABEL_PREFIX);

export const stockLabelRegExp = labelCodeRegExp(STOCK_LABEL_PREFIX);
