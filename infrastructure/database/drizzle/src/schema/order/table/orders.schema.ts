import { uuid } from 'drizzle-orm/pg-core';
import { orderSchema } from '../order.schema';

export const orders = orderSchema.table('orders', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
});
