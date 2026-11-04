import { text, uuid, varchar } from 'drizzle-orm/pg-core';
import { actorsSchema } from './actors.schema';
import { phoneFormatCheck } from './helpers/phone-format-check';

export const COURIER_CHECKS = {
  courierPhoneFormat: 'phone_format_chk',
};

export const couriers = actorsSchema.table(
  'couriers',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    nickname: text('nickname').unique().notNull(),
    phone: varchar('phone', { length: 11 }).unique().notNull(),
  },
  (t) => [phoneFormatCheck(t.phone)],
);
