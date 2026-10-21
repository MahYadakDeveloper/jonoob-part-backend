import { text, uuid, varchar } from 'drizzle-orm/pg-core';
import { actorsSchema } from '../actors.schema';

export const managers = actorsSchema.table('managers', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: text('full_name').notNull(),
  phone: text('phone').unique().notNull(),
  hashedPassword: varchar('hashed_password').notNull(),
});
