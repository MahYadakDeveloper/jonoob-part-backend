import { jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';
import { unitOfMeasure } from '../../warehouse';
import { orderSchema } from '../order.schema';
import { orders } from './orders.schema';

type FulfillmentItem = {
  stockId: string;
  quantity: number;
  unitOfMeasure: (typeof unitOfMeasure.enumValues)[number];
};

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

  items: jsonb('items').$type<FulfillmentItem[]>().notNull(),

  status: fulfillmentStatus('status').notNull().default('processing'),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});
