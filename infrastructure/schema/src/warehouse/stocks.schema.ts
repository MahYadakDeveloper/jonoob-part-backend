import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { procurements } from '../procurements/procurements.schema';
import { products } from './products.schema';
import { warehouseSchema } from './warehouse.schema';

export const STOCK_CONSTRAINTS = {
  quantityNonNegative: 'stocks_quantity_non_negative_chk',
  storageLocationNotBlank: 'stocks_storage_location_not_blank_chk',
  idFormat: 'stocks_id_format_chk',
  seqPositive: 'stocks_seq_positive_chk',
  zeroedAtConsistent: 'stocks_zeroed_at_consistent_chk',
} as const;

// ---------------------------------------------------------------------------
// Single-row counter for FRESH seq numbers.
//
// Why a table and not a SEQUENCE: nextval() is never rolled back, so every
// rolled-back insert would burn a number forever (a permanent gap). An UPDATE
// on this row happens inside the inserting transaction, so it rolls back
// together with it.
//
// Managed ONLY by warehouse.next_stock_seq() (see migration 0001).
// The row is seeded in migration 0001. max_seq is the ceiling for fresh numbers;
// after last_seq reaches max_seq, numbers come from free_stock_seqs.
//
// NOTE: the row lock is held until the end of the inserting transaction, so
// all inserts into stocks are serialized. Keep transactions that create new
// stocks short.
// ---------------------------------------------------------------------------
export const stockCounter = warehouseSchema.table(
  'stock_counter',
  {
    singleton: boolean('singleton').default(true).primaryKey().notNull(),
    lastSeq: bigint('last_seq', { mode: 'bigint' })
      .default(sql`0`)
      .notNull(),
    maxSeq: bigint('max_seq', { mode: 'bigint' }).notNull(),
  },
  (t) => [
    check('stock_counter_singleton_chk', sql`${t.singleton}`),
    check('stock_counter_max_positive_chk', sql`${t.maxSeq} > 0`),
    check(
      'stock_counter_range_chk',
      sql`${t.lastSeq} >= 0 AND ${t.lastSeq} <= ${t.maxSeq}`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Numbers released by deleted stocks, waiting to be reused (only after the
// counter has reached max_seq).
// Managed ONLY by triggers (see migration 0001).
// ---------------------------------------------------------------------------
export const freeStockSeqs = warehouseSchema.table(
  'free_stock_seqs',
  {
    seq: bigint('seq', { mode: 'bigint' }).primaryKey().notNull(),
    freedAt: timestamp('freed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [check('free_stock_seqs_seq_positive_chk', sql`${t.seq} > 0`)],
);

// ---------------------------------------------------------------------------
// Current quantity per product and procurement/source.
//
// Identity model: `seq` is the primary key and `id` (the "S000000000042"
// label, generated from seq) is UNIQUE, so child tables reference stocks.id
// with a foreign key. Because a stock can only be deleted when no child row
// references it (onDelete: 'restrict') or its children are deleted with it
// (onDelete: 'cascade'), a label can only be recycled when nothing in the
// database still points at it.
//
// References that live OUTSIDE foreign keys (events, logs, caches, printed
// labels, POS) are NOT protected: purge/invalidate them when a stock is deleted.
//
// Example child table (put it in its own file):
//
//   export const stockMovements = warehouseSchema.table('stock_movements', {
//     movementId: uuid('movement_id').defaultRandom().primaryKey().notNull(),
//     stockId: text('stock_id')
//       .notNull()
//       .references(() => stocks.id, { onDelete: 'restrict' }),
//     ...
//   }, (t) => [index('stock_movements_stock_id_idx').on(t.stockId)]);
//
// ALWAYS add an index on the FK column in child tables (the purge job probes
// every referencing table with NOT EXISTS).
// ---------------------------------------------------------------------------
export const stocks = warehouseSchema.table(
  'stocks',
  {
    // Allocated by the BEFORE INSERT trigger stocks_assign_seq.
    // DEFAULT NULL only makes the column optional for Drizzle inserts; the
    // trigger overwrites whatever is supplied. Immutable after insert
    // (trigger stocks_seq_immutable). Do not remove those triggers.
    seq: bigint('seq', { mode: 'bigint' })
      .default(sql`NULL`)
      .primaryKey()
      .notNull(),

    // Display label AND foreign-key target. Generated from seq, so it never
    // changes during the lifetime of a row.
    id: text('id')
      .notNull()
      .generatedAlwaysAs(
        sql`'S' || CASE
          WHEN length(seq::text) < 12
            THEN lpad(seq::text, 12, '0')
          ELSE seq::text
        END`,
      )
      .unique('stocks_label_id_uq'),

    productId: uuid('product_id')
      .references(() => products.id, { onDelete: 'restrict' })
      .notNull(),

    procurementId: uuid('procurement_id').references(() => procurements.id, {
      onDelete: 'restrict',
    }),

    quantity: integer('quantity').notNull(),

    storageLocation: text('storage_location'),

    declaredAt: timestamp('declared_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    // Moment quantity became 0; NULL while quantity > 0.
    // Maintained ONLY by trigger stocks_track_zeroed (migration 0001).
    // Used by the purge job to apply a grace period before deleting.
    zeroedAt: timestamp('zeroed_at', { withTimezone: true }),
  },
  (t) => [
    check(STOCK_CONSTRAINTS.idFormat, sql`${t.id} ~ '^S[0-9]{12,19}$'`),
    check(STOCK_CONSTRAINTS.seqPositive, sql`${t.seq} > 0`),
    check(STOCK_CONSTRAINTS.quantityNonNegative, sql`${t.quantity} >= 0`),
    check(
      STOCK_CONSTRAINTS.zeroedAtConsistent,
      sql`(${t.quantity} = 0) = (${t.zeroedAt} IS NOT NULL)`,
    ),
    unique('stocks_product_procurement_uq')
      .on(t.productId, t.procurementId)
      .nullsNotDistinct(),
    // Partial index for the purge job: only empty stocks are indexed.
    index('stocks_zeroed_idx')
      .on(t.zeroedAt, t.seq)
      .where(sql`${t.quantity} = 0`),
  ],
);
