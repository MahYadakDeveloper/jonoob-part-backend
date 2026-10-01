import {
  InboundMovementSource,
  OutboundMovementSource,
} from '@feature/warehouse-api';
import { AnyPgColumn, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { warehouseSchema } from './warehouse.schema';

type MovementData =
  | {
      direction: 'inbound';
      source: InboundMovementSource;
    }
  | {
      direction: 'outbound';
      source: OutboundMovementSource;
    };

export const movements = warehouseSchema.table('movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  idempotencyKey: text('idempotency_key').unique().notNull(),

  items: jsonb('items')
    .$type<
      {
        stockId: string;
        quantity: number;
      }[]
    >()
    .notNull(),

  data: jsonb('data').$type<MovementData>().notNull(),

  reversesId: uuid('reverses_id')
    .unique()
    .references((): AnyPgColumn => movements.id),

  recordedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
