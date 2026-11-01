import { sql } from 'drizzle-orm';
import { check, uuid, varchar } from 'drizzle-orm/pg-core';
import { actorsSchema } from './actors.schema';
import { phoneFormatCheck } from './checks';

export const technicianSpecialty = actorsSchema.enum('technician_specialty', [
  'electrical',
  'mechanical',
  'body_repair',
  'painting',
  'tire_service',
  'detailing',
]);

export const customerType = actorsSchema.enum('customer_type', [
  'merchant',
  'consumer',
  'technician',
]);

export const customers = actorsSchema.table(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    fullName: varchar('full_name', { length: 32 }),
    phone: varchar('phone', { length: 11 }).unique().notNull(),
    type: customerType().notNull(),
    specialty: technicianSpecialty(),
  },
  (t) => [
    phoneFormatCheck(t.phone),
    check(
      'chk_technician_specialty_required',
      sql`(${t.type} = 'technician') = (${t.specialty} IS NOT NULL)`,
    ),
  ],
);
