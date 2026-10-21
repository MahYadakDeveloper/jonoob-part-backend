import { defineRelationsPart } from 'drizzle-orm';
import { couriers } from '../actors/tables/couriers.schema';
import { customers } from '../actors/tables/customers.schema';
import { merchandiseLine } from '../public';
import * as schemas from './table';

export const orderRelations = defineRelationsPart(
  { ...{ ...schemas, couriers, customers, merchandiseLine } },
  (r) => ({
    deliveryAttemptFailures: {},
    merchandiseLine: {
      items: r.many.merchandiseLine({
        from: r.merchandiseLine.id,
        to: r.merchandiseLine.bundleId,
        where: { kind: 'leaf' },
        alias: 'bundle_items',
      }),
      bundle: r.one.merchandiseLine({
        from: r.merchandiseLine.bundleId,
        to: r.merchandiseLine.id,
        optional: true,
        alias: 'bundle_items',
      }),
    },
    fulfillments: {
      merchandiseLines: r.many.merchandiseLine({
        from: r.fulfillments.orderId,
        to: r.merchandiseLine.orderId,
      }),
    },
    orders: {
      merchandiseLines: r.many.merchandiseLine({
        from: r.orders.id,
        to: r.merchandiseLine.orderId,
      }),
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
      attempts: r.many.deliveryAttemptFailures({
        from: r.deliveries.id,
        to: r.deliveryAttemptFailures.deliveryId,
      }),
    },
    payments: {
      merchandise: r.many.merchandiseLine({
        from: r.payments.orderId,
        to: r.merchandiseLine.orderId,
      }),
    },
  }),
);
