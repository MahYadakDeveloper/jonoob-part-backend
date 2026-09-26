import { integer, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { warehouseSchema } from '../warehouse.schema';
import { stocks } from './stocks';

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
