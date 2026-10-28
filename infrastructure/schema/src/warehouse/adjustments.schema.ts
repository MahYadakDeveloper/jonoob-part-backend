import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { managers } from '../actors/manager.schema';
import { stocks } from './stocks.schema';
import { warehouseSchema } from './warehouse.schema';

export const ADJUSTMENT_CHECKS = {
  quantityPositive: 'adjustments_quantity_positive_chk',
  otherRequiresNote: 'adjustments_other_requires_note_chk',
  reasonMatchesEffect: 'adjustments_reason_matches_effect_chk',
} as const;

export const adjustmentEffect = warehouseSchema.enum('adjustment_effect', [
  'surplus',
  'shortage',
]);

export const adjustmentReason = warehouseSchema.enum('adjustment_reason', [
  'damaged',
  'lost',
  'found',
  'count_correction',
  'other',
]);

export const adjustments = warehouseSchema.table(
  'adjustments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    managerId: uuid('manager_id')
      .references(() => managers.id, { onDelete: 'restrict' })
      .notNull(),
    stockId: uuid('stock_id')
      .references(() => stocks.id, { onDelete: 'restrict' })
      .notNull(),
    quantity: integer('quantity').notNull(),
    effect: adjustmentEffect('effect').notNull(),
    reason: adjustmentReason('reason').notNull(),
    note: text('note'),
    adjustedAt: timestamp('adjusted_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check(ADJUSTMENT_CHECKS.quantityPositive, sql`${t.quantity} > 0`),
    // 'other' requires a non-blank note
    check(
      ADJUSTMENT_CHECKS.otherRequiresNote,
      sql`${t.reason} <> 'other' OR nullif(btrim(${t.note}), '') IS NOT NULL`,
    ),
    // damaged/lost can only reduce stock, found can only increase it
    check(
      ADJUSTMENT_CHECKS.reasonMatchesEffect,
      sql`CASE ${t.reason}
        WHEN 'damaged' THEN ${t.effect} = 'shortage'
        WHEN 'lost'    THEN ${t.effect} = 'shortage'
        WHEN 'found'   THEN ${t.effect} = 'surplus'
        ELSE true
      END`,
    ),
    index('adjustments_manager_id_idx').on(t.managerId),
    index('adjustments_stock_id_idx').on(t.stockId),
    index('adjustments_created_at_idx').on(t.adjustedAt),
  ],
);
