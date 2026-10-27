import { uuid } from 'drizzle-orm/pg-core';
import { procurementSchema } from './procurement.schema';

export const procurements = procurementSchema.table('procurements', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
});
