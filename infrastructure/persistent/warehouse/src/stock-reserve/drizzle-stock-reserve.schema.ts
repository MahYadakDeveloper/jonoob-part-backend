import { integer, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { stocks } from '../stock/drizzle-stocks.schema';
import { warehouseSchema } from '../warehouse.schema';

export const reserves = warehouseSchema.table(
  'reserves',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    referenceId: varchar('reference_id').notNull(),
    stockId: uuid('stock_id')
      .notNull()
      .references(() => stocks.id),
    qty: integer('qty').notNull(),
  },
  (table) => [
    unique('reserves_reference_id_stock_id_unique').on(
      table.referenceId,
      table.stockId,
    ),
  ],
);
