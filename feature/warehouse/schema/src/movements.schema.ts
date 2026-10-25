import { integer, timestamp, uuid } from 'drizzle-orm/pg-core';
import { warehouseSchema } from './warehouse.schema';

export const movementDirection = warehouseSchema.enum('movement_direction', [
  'inbound',
  'outbound',
]);

export const movementSource = warehouseSchema.enum('movement_source', [
  'order',
  'sale',
  'return',
  'procurement',
  'quarantine',
  'adjustment',
]);

export const movementItems = warehouseSchema.table('movement_items', {
  movementId: uuid('movement_id')
    .references(() => movements.id, {
      onDelete: 'cascade',
    })
    .notNull(),

  stockId: uuid('stock_id').notNull(),
  quantity: integer('quantity').notNull(),
});

export const movements = warehouseSchema.table('movements', {
  id: uuid('id').defaultRandom().primaryKey(),

  direction: movementDirection('direction').notNull(),

  source: movementSource('source').notNull(),
  referenceId: uuid('reference_id'),

  movedAt: timestamp('moved_at', { withTimezone: true }).defaultNow().notNull(),
});
