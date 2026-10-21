import { sql } from 'drizzle-orm';
import { check, uuid, varchar } from 'drizzle-orm/pg-core';
import { actorsSchema } from '../actors.schema';

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
    fullName: varchar('full_name').notNull(),
    phone: varchar('phone').unique().notNull(),
    type: customerType().notNull(),
    specialty: technicianSpecialty(),
  },
  (t) => [
    check(
      'chk_technician_specialty_required',
      sql`(${t.type} = 'technician') = (${t.specialty} IS NOT NULL)`,
    ),
  ],
);
