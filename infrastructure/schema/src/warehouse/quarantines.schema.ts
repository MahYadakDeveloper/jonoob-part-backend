import { index, text, uuid } from 'drizzle-orm/pg-core';
import { movements } from './movements.schema';
import { stocks } from './stocks.schema';
import { warehouseSchema } from './warehouse.schema';

export const quarantines = warehouseSchema.table(
  'quarantines',
  {
    stockId: uuid('stock_id')
      .notNull()
      .references(() => stocks.id, { onDelete: 'restrict' }),

    movementId: uuid('movement_id')
      .references(() => movements.id, {
        onDelete: 'restrict',
      })
      .notNull(),

    note: text('note'),
  },
  (t) => [
    // The purge job probes this FK column with NOT EXISTS.
    index('quarantines_stock_id_idx').on(t.stockId),
  ],
);
