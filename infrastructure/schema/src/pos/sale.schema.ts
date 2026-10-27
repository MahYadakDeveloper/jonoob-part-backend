import { uuid } from 'drizzle-orm/pg-core';
import { posSchema } from './pos.schema';

export const sales = posSchema.table('sales', {
  id: uuid().defaultRandom().primaryKey().notNull(),
});
