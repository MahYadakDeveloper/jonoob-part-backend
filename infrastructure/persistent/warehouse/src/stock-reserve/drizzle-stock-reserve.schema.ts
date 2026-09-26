import { integer, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { stocks } from '../stock/drizzle-stocks.schema';
import { warehouseSchema } from '../warehouse.schema';

export const reserves = warehouseSchema.table(
  'reserves',
  {
    id: uuid().defaultRandom().primaryKey(),

    referenceId: varchar().notNull(),
    stockId: uuid()
      .notNull()
      .references(() => stocks.id),
    qty: integer().notNull(),
  },
  (table) => [unique().on(table.referenceId, table.stockId)],
);
