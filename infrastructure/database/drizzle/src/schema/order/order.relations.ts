import { defineRelationsPart } from 'drizzle-orm';
import { couriers } from '../actors/tables/couriers.schema';
import * as schemas from './table';

export const orderRelations = defineRelationsPart(
  { ...{ ...schemas, couriers } },
  (r) => ({
    orders: {
      deliveries: r.many.deliveries({
        from: r.orders.id,
        to: r.deliveries.orderId,
      }),
    },
    deliveries: {
      order: r.one.orders({
        from: r.deliveries.orderId,
        to: r.orders.id,
      }),
      courier: r.one.couriers({
        from: r.deliveries.courierId,
        to: r.couriers.id,
      }),
    },
  }),
);
