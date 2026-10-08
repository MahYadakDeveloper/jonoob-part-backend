import { text, uuid } from 'drizzle-orm/pg-core';
import { actorsSchema } from '../actors.schema';

export const couriers = actorsSchema.table('couriers', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  fullName: text('fullname').notNull(),
  phone: text('phone').unique().notNull(),
});
