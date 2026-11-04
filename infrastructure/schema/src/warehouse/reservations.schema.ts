import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { products } from '../catalog/products.schema';
import { warehouseSchema } from './warehouse.schema';

export const RESERVATIONS_CHECKS = {
  reservationItemsQtyPositive: 'reservation_items_qty_positive_chk',
  expiresAfterCreated: 'reservations_expires_after_created_chk',
  settledAtMatchesStatus: 'reservations_settled_at_matches_status_chk',
} as const;

export const reservationStatus = warehouseSchema.enum('reservation_status', [
  'active',
  'fulfilled', // converted into an actual outbound movement
  'released', // manually cancelled
  'expired', // deadline passed
]);

export const reservations = warehouseSchema.table(
  'reservations',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // The order/document this reservation is for (no FK, same as movements.referenceId)
    referenceId: uuid('reference_id').notNull(),

    status: reservationStatus('status').notNull().default('active'),

    // null means no expiry
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    // When the reservation left the active state (fulfilled / released / expired)
    settledAt: timestamp('settled_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check(
      RESERVATIONS_CHECKS.expiresAfterCreated,
      sql`${t.expiresAt} IS NULL OR ${t.expiresAt} > ${t.createdAt}`,
    ),
    check(
      RESERVATIONS_CHECKS.settledAtMatchesStatus,
      sql`(${t.status} = 'active') = (${t.settledAt} IS NULL)`,
    ),
    // At most one active reservation per document
    uniqueIndex('reservations_active_reference_uq')
      .on(t.referenceId)
      .where(sql`${t.status} = 'active'`),
    // Expiry sweep: only active reservations that have a deadline
    index('reservations_active_expires_idx')
      .on(t.expiresAt)
      .where(sql`${t.status} = 'active' AND ${t.expiresAt} IS NOT NULL`),
    // Reservation history of a document
    index('reservations_reference_idx').on(t.referenceId),
  ],
);

export const reservationItems = warehouseSchema.table(
  'reservation_items',
  {
    reservationId: uuid('reservation_id')
      .notNull()
      .references(() => reservations.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.reservationId, t.productId] }),
    check(
      RESERVATIONS_CHECKS.reservationItemsQtyPositive,
      sql`${t.quantity} > 0`,
    ),
    // Used to compute the total reserved quantity of a product
    index('reservation_items_product_id_idx').on(t.productId),
  ],
);
