import { text, uuid } from 'drizzle-orm/pg-core';
import { movements } from './movements.schema';
import { stocks } from './stocks.schema';
import { warehouseSchema } from './warehouse.schema';

export const quarantines = warehouseSchema.table('quarantines', {
  stockId: uuid('stock_id')
    .notNull()
    .references(() => stocks.id, { onDelete: 'restrict' }),

  movementId: uuid('movement_id')
    .unique()
    .references(() => movements.id, {
      onDelete: 'restrict',
    })
    .notNull(),

  note: text('note'),
});
