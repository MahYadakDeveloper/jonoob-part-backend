import { uuid } from 'drizzle-orm/cockroach-core';
import { jsonb, timestamp, varchar } from 'drizzle-orm/pg-core';
import { warehouseSchema } from '../warehouse.schema';

export const transactionType = warehouseSchema.enum('transaction_type', [
  'inbound',
  'outbound',
]);

export const transactions = warehouseSchema.table('transactions', {
  id: uuid().defaultRandom().primaryKey(),
  items: jsonb()
    .$type<
      {
        stockId: string;
        qty: number;
      }[]
    >()
    .notNull(),
  recordedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  type: transactionType().notNull(),
  referenceId: uuid().notNull(),
  referenceSource: varchar().notNull(),
});
