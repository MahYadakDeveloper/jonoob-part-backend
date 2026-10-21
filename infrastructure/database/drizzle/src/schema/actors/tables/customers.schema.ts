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

export const walletTransactionReason = actorsSchema.enum(
  'wallet_transaction_reason',
  [
    'cashback',
    'manual_adjustment',
    'refund',
    'payment',
    'withdrawal',
    'cashback_reversal',
    'withdrawal_request',
    'manual',
  ],
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
    reason: walletTransactionReason('reason').notNull(),
    description: text('description'),
    freezedAmountId: uuid('freezed_amount_id').references(
      () => freezedAmounts.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('uq_wallet_tx_idempotency').on(t.walletId, t.idempotencyKey),
    check('chk_wallet_tx_amount_positive', sql`${t.amount} > 0`),
    check(
      'chk_wallet_tx_freeze_ref',
      sql`${t.type} <> 'freeze' OR ${t.freezedAmountId} IS NOT NULL`,
    ),
    index('idx_wallet_tx_freezed_amount').on(t.freezedAmountId),
  ],
);

export const freezedAmounts = actorsSchema.table('freezed_amounts', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => wallets.id, {
      onDelete: 'cascade',
    }),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  reason: walletTransactionReason('reason')
    .$type<'withdrawal_request' | 'manual'>()
    .notNull(),
});

export const wallets = actorsSchema.table(
  'wallets',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .unique()
      .references(() => customers.id, { onDelete: 'restrict' }),
    total: bigint('total', { mode: 'number' }).notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [check('chk_wallets_total_non_negative', sql`${t.total} >= 0`)],
);

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
