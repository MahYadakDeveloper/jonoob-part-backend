import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { orders } from '../order/orders.schema';
import { sales } from '../pos/sale.schema';
import { procurements } from '../procurements/procurements.schema';
import { adjustments } from './adjustments.schema';
import { stocks } from './stocks.schema';
import { warehouseSchema } from './warehouse.schema';

export const MOVEMENT_CHECKS = {
  itemQuantityPositive: 'movement_items_quantity_positive_chk',
  referenceMatchesSource: 'movements_reference_matches_source_chk',
  procurementIsInbound: 'movements_procurement_is_inbound_chk',
} as const;

export const movementDirection = warehouseSchema.enum('movement_direction', [
  'inbound',
  'outbound',
]);

export const movementSource = warehouseSchema.enum('movement_source', [
  'order',
  'sale',
  'procurement',
  'adjustment',
]);

export const movementItems = warehouseSchema.table(
  'movement_items',
  {
    movementId: uuid('movement_id')
      .references(() => movements.id, { onDelete: 'cascade' })
      .notNull(),
    stockId: uuid('stock_id')
      .references(() => stocks.id, { onDelete: 'restrict' })
      .notNull(),
    quantity: integer('quantity').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.movementId, t.stockId] }),
    check(MOVEMENT_CHECKS.itemQuantityPositive, sql`${t.quantity} > 0`),
    index('movement_items_stock_id_idx').on(t.stockId),
  ],
);

export const movements = warehouseSchema.table(
  'movements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    direction: movementDirection('direction').notNull(),
    source: movementSource('source').notNull(),

    orderId: uuid('order_id').references(() => orders.id, {
      onDelete: 'restrict',
    }),
    saleId: uuid('sale_id').references(() => sales.id, {
      onDelete: 'restrict',
    }),
    procurementId: uuid('procurement_id').references(() => procurements.id, {
      onDelete: 'restrict',
    }),
    adjustmentId: uuid('adjustment_id').references(() => adjustments.id, {
      onDelete: 'restrict',
    }),

    movedAt: timestamp('moved_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check(
      MOVEMENT_CHECKS.referenceMatchesSource,
      sql`
        num_nonnulls(${t.orderId}, ${t.saleId}, ${t.procurementId}, ${t.adjustmentId}) = 1
        AND CASE ${t.source}
          WHEN 'order'       THEN ${t.orderId} IS NOT NULL
          WHEN 'sale'        THEN ${t.saleId} IS NOT NULL
          WHEN 'procurement' THEN ${t.procurementId} IS NOT NULL
          WHEN 'adjustment'  THEN ${t.adjustmentId} IS NOT NULL
        END
      `,
    ),
    check(
      MOVEMENT_CHECKS.procurementIsInbound,
      sql`${t.source} <> 'procurement' OR ${t.direction} = 'inbound'`,
    ),
    index('movements_order_id_idx').on(t.orderId),
    index('movements_sale_id_idx').on(t.saleId),
    index('movements_procurement_id_idx').on(t.procurementId),
  ],
);
