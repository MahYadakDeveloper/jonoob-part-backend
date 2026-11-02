import { index, integer, unique, uuid } from 'drizzle-orm/pg-core';
import { procurementSchema } from './procurement.schema';
import { stocks } from '../warehouse/stocks.schema';

export const procurementItems = procurementSchema.table(
  'procurement_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    stockId: uuid('stock_id')
      .references(() => stocks.id, { onDelete: 'restrict' })
      .notNull(),

    procurementId: uuid('procurement_id')
      .references(() => procurements.id, { onDelete: 'cascade' })
      .notNull(),

    price: integer('price'),
    quantity: integer('quantity'),
    // ...
  },
  (t) => [
    // Within one procurement each stock may appear only once.
    // Also serves FK lookups by procurement_id (first column).
    unique('procurement_items_procurement_stock_uq').on(
      t.procurementId,
      t.stockId,
    ),
    // FK lookups by stock_id (the uniques above start with other columns).
    index('procurement_items_stock_id_idx').on(t.stockId),
  ],
);

export const procurements = procurementSchema.table('procurements', {
  id: uuid('id').defaultRandom().primaryKey(),
});
