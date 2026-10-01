import { integer, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { stocks } from './stocks.schema';
import { warehouseSchema } from './warehouse.schema';

export const reserves = warehouseSchema.table(
  'reserves',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    referenceId: varchar('reference_id').notNull(),
    stockId: uuid('stock_id')
      .notNull()
      .references(() => stocks.id),
    quantity: integer('quantity').notNull(),
  },
  (table) => [
    unique('uq_ref_id_stock_id').on(table.referenceId, table.stockId),
  ],
);
