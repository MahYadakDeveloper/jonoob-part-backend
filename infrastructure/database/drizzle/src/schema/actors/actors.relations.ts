import { defineRelationsPart } from 'drizzle-orm';
import { deliveries } from './../order/table/deliveries.schema';
import * as schemas from './tables';

export const actorsRelations = defineRelationsPart(
  {
    ...{ ...schemas, deliveries },
  },
  (r) => ({
    deliveries: {},
    couriers: {
      deliveries: r.many.deliveries({
        from: r.couriers.id,
        to: r.deliveries.courierId,
      }),
    },
  }),
);
