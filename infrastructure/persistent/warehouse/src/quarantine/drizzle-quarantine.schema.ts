import { integer, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { stocks } from '../stock/drizzle-stocks.schema';
import { warehouseSchema } from '../warehouse.schema';

export const quarantines = warehouseSchema.table('quarantines', {
  id: uuid().defaultRandom().primaryKey(),

  stockId: uuid()
    .notNull()
    .references(() => stocks.id),

  referenceId: varchar().notNull(),
  reason: text().notNull(),
  qty: integer().notNull(),
});
