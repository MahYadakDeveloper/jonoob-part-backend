import { timestamp, uuid } from 'drizzle-orm/pg-core';
import { orderSchema } from '../order.schema';
import { orders } from './orders.schema';

export const fulfillmentStatus = orderSchema.enum('fulfillment_status', [
  'processing',
  'fulfilled',
  'canceled_by_customer',
  'canceled_by_merchant',
]);

export const fulfillments = orderSchema.table('fulfillments', {
  orderId: uuid('order_id')
    .primaryKey()
    .references(() => orders.id, { onDelete: 'cascade' }),

  status: fulfillmentStatus('status').notNull().default('processing'),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});
