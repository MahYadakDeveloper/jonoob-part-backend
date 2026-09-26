import { integer, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { warehouseSchema } from '../warehouse.schema';
import { stocks } from './stocks';

export const quarantines = warehouseSchema.table('quarantines', {
  id: uuid().defaultRandom().primaryKey(),

  stockId: uuid()
    .notNull()
    .references(() => stocks.id),

  referenceId: varchar().notNull(),
  reason: text().notNull(),
  qty: integer().notNull(),
});
