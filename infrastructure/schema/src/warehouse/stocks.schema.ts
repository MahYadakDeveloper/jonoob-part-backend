import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { warehouseSchema } from './warehouse.schema';
import {
  createLabelTables,
  labelCodeRegExp,
} from '../public/helpers/create-label-table';

export const STOCK_CONSTRAINTS = {
  storageLocationNotBlank: 'stocks_storage_location_not_blank_chk',
  zeroedAtConsistent: 'stocks_zeroed_at_consistent_chk',
} as const;

export const stocks = warehouseSchema.table(
  'stocks',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    quantity: integer('quantity').default(0).notNull(),

    storageLocation: text('storage_location'),

    declaredAt: timestamp('declared_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    // Moment quantity became 0; NULL while quantity > 0.
    // Maintained ONLY by trigger stocks_track_zeroed.
    // Used by the purge job to apply a grace period before deleting.
    zeroedAt: timestamp('zeroed_at', { withTimezone: true }),
  },
  (t) => [
    check(
      STOCK_CONSTRAINTS.storageLocationNotBlank,
      sql`${t.storageLocation} IS NULL OR btrim(${t.storageLocation}) <> ''`,
    ),
    check(
      STOCK_CONSTRAINTS.zeroedAtConsistent,
      sql`(${t.quantity} = 0) = (${t.zeroedAt} IS NOT NULL)`,
    ),
    // Partial index for the purge job: only empty stocks are indexed.
    index('stocks_zeroed_idx')
      .on(t.zeroedAt, t.id)
      .where(sql`${t.quantity} = 0`),
  ],
);

const STOCK_LABEL_PREFIX = 'S';

export const {
  counter: _,
  freeSeqs: __,
  labels: stockLabels,
} = createLabelTables(warehouseSchema, stocks, STOCK_LABEL_PREFIX);

export const stockLabelRegExp = labelCodeRegExp(STOCK_LABEL_PREFIX);
