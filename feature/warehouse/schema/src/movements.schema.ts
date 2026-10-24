import { integer, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { warehouseSchema } from './warehouse.schema';

export const movementDirection = warehouseSchema.enum('movement_direction', [
  'inbound',
  'outbound',
]);

export const movementSource = warehouseSchema.enum('movement_source', [
  'order',
  'pos',
  'return', // Quarantine is created and related to the movement and all movement items is record and the only none quarantined is only restocked
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

  idempotencyKey: text('idempotency_key').unique(),

  direction: movementDirection('direction').notNull(),

  source: movementSource('source').notNull(),
  referenceId: uuid('reference_id'),

  movedAt: timestamp('moved_at', { withTimezone: true }).defaultNow().notNull(),
});
