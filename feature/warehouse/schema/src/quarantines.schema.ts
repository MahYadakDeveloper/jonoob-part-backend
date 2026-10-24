import { text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { movements } from './movements.schema';
import { stocks } from './stocks.schema';
import { warehouseSchema } from './warehouse.schema';

export const quarantinesItems = warehouseSchema.table('quarantines_items', {
  stockId: uuid('stock_id')
    .notNull()
    .references(() => stocks.id, { onDelete: 'restrict' }),

  quarantineId: uuid('quarantine_id').references(() => quarantines.id, {
    onDelete: 'restrict',
  }),

  note: text('note'),
});

export const quarantines = warehouseSchema.table('quarantine', {
  id: uuid('id').defaultRandom().primaryKey(),

  movementId: uuid('movement_id').references(() => movements.id, {
    onDelete: 'cascade',
  }),

  quarantinedAt: timestamp('quarantined_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
