import { defineRelationsPart } from 'drizzle-orm';
import { couriers } from '../actors/tables/couriers.schema';
import { customers } from '../actors/tables/customers.schema';
import * as schemas from './table';

export const orderRelations = defineRelationsPart(
  { ...{ ...schemas, couriers, customers } },
  (r) => ({
    orders: {
      payment: r.one.payments({
        from: r.orders.id,
        to: r.payments.orderId,
        optional: false,
      }),
      fulfillment: r.one.fulfillments({
        from: r.orders.id,
        to: r.fulfillments.orderId,
      }),
      delivery: r.one.deliveries({
        from: r.orders.id,
        to: r.deliveries.orderId,
        optional: false,
      }),
      summary: r.one.orderSummary({
        from: r.orders.id,
        to: r.orderSummary.orderId,
        optional: false,
      }),
    },
    deliveries: {
      courier: r.one.couriers({
        from: r.deliveries.courierId,
        to: r.couriers.id,
      }),
    },
  }),
);
