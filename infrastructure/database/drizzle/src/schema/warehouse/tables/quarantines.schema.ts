import { integer, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { stocks } from './stocks.schema';
import { warehouseSchema } from '../warehouse.schema';

export const quarantines = warehouseSchema.table('quarantines', {
  id: uuid().defaultRandom().primaryKey().notNull(),

  stockId: uuid()
    .notNull()
    .references(() => stocks.id),

  referenceId: varchar().notNull(),
  reason: text().notNull(),
  qty: integer().notNull(),
});
