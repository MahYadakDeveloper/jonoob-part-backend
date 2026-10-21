import { sql } from 'drizzle-orm';
import {
  check,
  doublePrecision,
  index,
  integer,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { actorsSchema } from '../actors.schema';
import { customers } from './customers.schema';

export const addresses = actorsSchema.table(
  'addresses',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),

    cityId: integer('city_id').notNull(),
    provinceId: integer('province_id').notNull(),

    address: text('address'),
    postalCode: varchar('postal_code'),

    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
  },
  (t) => [
    index('idx_addresses_customer_id').on(t.customerId),

    check(
      'addresses_location_or_postal_address_check',
      sql`
        (
          ${t.latitude} IS NOT NULL
          AND ${t.longitude} IS NOT NULL
          AND ${t.address} IS NULL
          AND ${t.postalCode} IS NULL
        )
        OR
        (
          ${t.latitude} IS NULL
          AND ${t.longitude} IS NULL
          AND ${t.address} IS NOT NULL
          AND ${t.postalCode} IS NOT NULL
        )
      `,
    ),
  ],
);
