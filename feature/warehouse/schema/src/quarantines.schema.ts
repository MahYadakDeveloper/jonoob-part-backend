import { sql } from 'drizzle-orm';
import { check, foreignKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { movements } from './movements.schema';
import { stocks } from './stocks.schema';
import { warehouseSchema } from './warehouse.schema';

export const returnReason = warehouseSchema.enum('return_reason', [
  'changed_mind',
  'wrong_item',
  'defective',
  'damaged',
  'not_as_described',
  'other',
]);

export const quarantines = warehouseSchema.table('quarantines', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  stockId: uuid('stock_id')
    .notNull()
    .references(() => stocks.id),

  movementId: uuid('movement_id').notNull(),

  movementSourceType: text('movement_source_type').notNull().default('return'),

  reason: returnReason('reason').notNull(),
  note: text('note'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
