import { text, uuid, varchar } from 'drizzle-orm/pg-core';
import { actorsSchema } from '../actors.schema';

export const couriers = actorsSchema.table('couriers', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone').unique().notNull(),
  hashedPassword: varchar('hashed_password').notNull(),
});
