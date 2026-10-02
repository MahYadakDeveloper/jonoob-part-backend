import {
  InboundMovementSource,
  OutboundMovementSource,
} from '@feature/warehouse-api';
import { AnyPgColumn, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { warehouseSchema } from './warehouse.schema';

export const movements = warehouseSchema.table('movements', {
  id: uuid('id').defaultRandom().primaryKey(),

  idempotencyKey: text('idempotency_key').unique().notNull(),

  items: jsonb('items')
    .$type<{ stockId: string; quantity: number }[]>()
    .notNull(),

  details: jsonb('details')
    .$type<
      | ({
          direction: 'inbound';
        } & InboundMovementSource)
      | ({
          direction: 'outbound';
        } & OutboundMovementSource)
    >()
    .notNull(),

  reversesId: uuid('reverses_id')
    .unique()
    .references((): AnyPgColumn => movements.id),

  recordedAt: timestamp('recorded_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
