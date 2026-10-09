import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  doublePrecision,
  index,
  integer,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { actorsSchema } from '../actors.schema';

export const walletTransactionType = actorsSchema.enum(
  'wallet_transaction_type',
  ['deposit', 'withdraw', 'freeze', 'unfreeze'],
);

export const walletTransactions = actorsSchema.table(
  'wallet_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'restrict' }),
    idempotencyKey: varchar('idempotency_key').notNull(),
    type: walletTransactionType().notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('uq_wallet_tx_idempotency').on(t.walletId, t.idempotencyKey),
    check('chk_wallet_tx_amount_positive', sql`${t.amount} > 0`),
  ],
);

export const wallets = actorsSchema.table(
  'wallets',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .unique()
      .references(() => customers.id, { onDelete: 'restrict' }),
    total: bigint('total', { mode: 'number' }).notNull().default(0),
    frozen: bigint('frozen', { mode: 'number' }).notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check('chk_wallets_total_non_negative', sql`${t.total} >= 0`),
    check('chk_wallets_frozen_non_negative', sql`${t.frozen} >= 0`),
    check('chk_wallets_frozen_within_total', sql`${t.frozen} <= ${t.total}`),
  ],
);

export const addressScope = actorsSchema.enum('address_scope', [
  'intra_city',
  'inter_city',
]);

export const addresses = actorsSchema.table(
  'addresses',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    scope: addressScope().notNull(),
    cityId: integer('city_id').notNull(),
    address: text('address').notNull(),

    // inter_city only
    provinceId: integer('province_id'),
    postalCode: varchar('postal_code'),

    // intra_city only (optional)
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
  },
  (t) => [
    index('idx_addresses_customer_id').on(t.customerId),
    check(
      'chk_addresses_inter_city_required',
      sql`${t.scope} <> 'inter_city' OR (${t.provinceId} IS NOT NULL AND ${t.postalCode} IS NOT NULL)`,
    ),
    check(
      'chk_addresses_coordinate_pair',
      sql`(${t.latitude} IS NULL) = (${t.longitude} IS NULL)`,
    ),
    check(
      'chk_addresses_coordinate_intra_only',
      sql`${t.scope} = 'intra_city' OR ${t.latitude} IS NULL`,
    ),
  ],
);

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
