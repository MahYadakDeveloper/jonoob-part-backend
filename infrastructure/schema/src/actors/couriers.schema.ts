import { sql } from 'drizzle-orm';
import { check, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { actorsSchema } from './actors.schema';

export const couriers = actorsSchema.table(
  'couriers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fullName: text('full_name').notNull(),
    phone: varchar('phone', { length: 11 }).unique().notNull(),
  },
  (t) => [check('phone_format_chk', sql`${t.phone} ~ '^09[0-9]{9}$'`)],
);
