import { index, primaryKey, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { actorsSchema } from './actors.schema';
import { phoneFormatCheck } from './helpers/phone-format-check';

export const MANAGER_CHECKS = {
  managerPhoneFormat: 'managers_phones_phone_format_chk',
} as const;

export const permissionAction = actorsSchema.enum('permission_action', [
  'read',
  'write',
  'manage',
]);

/** for some permissions hardly coded managed, ex: actors */
export const permissionResource = actorsSchema.enum('permission_resource', [
  'warehouse:stocks',
  'warehouse:reservations',
  'warehouse:quarantines',
  'warehouse:movements',
  'catalog',
  // ...
]);

export const managers = actorsSchema.table('managers', {
  id: uuid('id').defaultRandom().primaryKey(),
  nickname: text('nickname').unique().notNull(),
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
    phone: varchar('phone', { length: 11 }).unique().notNull(),

    managerId: uuid('manager_id')
      .references(() => managers.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [
    phoneFormatCheck(t.phone),
    index('managers_phones_manager_id_idx').on(t.managerId),
  ],
);

export const managersPermissions = actorsSchema.table(
  'managers_permissions',
  {
    managerId: uuid('manager_id')
      .notNull()
      .references(() => managers.id, { onDelete: 'cascade' }),
    resource: permissionResource('resource').notNull(),
    action: permissionAction('action').notNull(),
  },
  (t) => [primaryKey({ columns: [t.managerId, t.resource, t.action] })],
);
