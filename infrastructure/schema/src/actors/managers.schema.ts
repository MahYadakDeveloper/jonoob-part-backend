import { sql } from 'drizzle-orm';
import { check, index, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { actorsSchema } from './actors.schema';

export const MANAGER_CHECKS = {
  managerPhoneFormat: 'managers_phones_phone_format_chk',
} as const;

export const managers = actorsSchema.table('managers', {
  id: uuid('id').defaultRandom().primaryKey(),
  nickName: text('nick_name').unique().notNull(),
});

export const managersPasswords = actorsSchema.table('managers_passwords', {
  managerId: uuid('manager_id')
    .primaryKey()
    .references(() => managers.id, { onDelete: 'cascade' }),
  hashedPassword: varchar('hashed_password', { length: 256 }).notNull(),
});

export const managersPhones = actorsSchema.table(
  'managers_phones',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    phone: varchar('phone', { length: 11 }).unique(),

    managerId: uuid('manager_id')
      .references(() => managers.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [
    check(MANAGER_CHECKS.managerPhoneFormat, sql`${t.phone} ~ '^09[0-9]{9}$'`),
    index('managers_phones_manager_id_idx').on(t.managerId),
  ],
);
