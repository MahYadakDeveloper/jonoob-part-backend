import { uuid } from 'drizzle-orm/pg-core';
import { orderSchema } from '../order.schema';
import { couriers } from '../../actors/tables';

export const deliveries = orderSchema.table('deliveries', {
  courierId: uuid('courier_id').references(() => couriers.id),
});
