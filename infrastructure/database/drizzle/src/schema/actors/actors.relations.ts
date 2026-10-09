import { defineRelationsPart } from 'drizzle-orm';
import { deliveries } from './../order/table/deliveries.schema';
import * as schemas from './tables';

export const actorsRelations = defineRelationsPart(
  {
    ...{ ...schemas, deliveries },
  },
  (r) => ({
    wallets: {},
    addresses: {},
    customers: {
      addresses: r.many.addresses({
        from: r.customers.id,
        to: r.addresses.customerId,
      }),
      wallet: r.one.wallets({
        from: r.customers.id,
        to: r.wallets.customerId,
      }),
    },

    deliveries: {},
    couriers: {
      deliveries: r.many.deliveries({
        from: r.couriers.id,
        to: r.deliveries.courierId,
      }),
    },
  }),
);
