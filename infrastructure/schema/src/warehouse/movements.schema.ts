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
import { shelves } from './shelves.schema';
import { warehouseSchema } from './warehouse.schema';

export const MOVEMENT_CHECKS = {
  itemQuantityPositive: 'movement_items_quantity_positive_chk',
  orderIsOutbound: 'movements_order_is_outbound_chk',
  procurementIsInbound: 'movements_procurement_is_inbound_chk',
  saleIsOutbound: 'movements_sale_is_outbound_chk',
  returnIsInbound: 'movements_return_is_inbound_chk',
} as const;

export const movementDirection = warehouseSchema.enum('movement_direction', [
  'inbound',
  'outbound',
]);

export const movementSource = warehouseSchema.enum('movement_source', [
  'order',
  'procurement',
  'sale',
  'return',
  'transfer',
  'adjustment',
]);

export const movementItems = warehouseSchema.table(
  'movement_items',
  {
    movementId: uuid('movement_id')
      .references(() => movements.id, { onDelete: 'cascade' })
      .notNull(),
    productId: uuid('product_id')
      .references(() => products.id, { onDelete: 'restrict' })
      .notNull(),
    shelfId: uuid('shelf_id')
      .notNull()
      .references(() => shelves.id, { onDelete: 'restrict' }),

    quantity: integer('quantity').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.movementId, t.productId, t.shelfId] }),
    check(MOVEMENT_CHECKS.itemQuantityPositive, sql`${t.quantity} > 0`),
    index('movement_items_product_id_idx').on(t.movementId, t.productId),
  ],
);

export const movements = warehouseSchema.table(
  'movements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    direction: movementDirection('direction').notNull(),
    source: movementSource('source').notNull(),
    referenceId: uuid('reference_id').notNull(),

    movedAt: timestamp('moved_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check(
      MOVEMENT_CHECKS.orderIsOutbound,
      sql`${t.source} <> 'order' OR ${t.direction} = 'outbound'`,
    ),
    check(
      MOVEMENT_CHECKS.procurementIsInbound,
      sql`${t.source} <> 'procurement' OR ${t.direction} = 'inbound'`,
    ),
    check(
      MOVEMENT_CHECKS.saleIsOutbound,
      sql`${t.source} <> 'sale' OR ${t.direction} = 'outbound'`,
    ),
    check(
      MOVEMENT_CHECKS.returnIsInbound,
      sql`${t.source} <> 'return' OR ${t.direction} = 'inbound'`,
    ),
    index('movements_source_reference_idx').on(t.source, t.referenceId),
    index('movements_moved_at_id_idx').on(t.movedAt.desc(), t.id.desc()),
    uniqueIndex('movements_transfer_ref_direction_uq')
      .on(t.referenceId, t.direction)
      .where(sql`${t.source} = 'transfer'`),
  ],
);
