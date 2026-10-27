import { uuid } from 'drizzle-orm/pg-core';
import { returnSchema } from './return.schema';

export const returns = returnSchema.table('returns', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
});
