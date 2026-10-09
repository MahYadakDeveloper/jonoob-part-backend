import { defineRelationsPart } from 'drizzle-orm';
import { couriers } from '../actors/tables/couriers.schema';
import * as schemas from './table';

export const orderRelations = defineRelationsPart(
  { ...{ ...schemas, couriers } },
  (r) => ({
    deliveries: {
      courier: r.one.couriers({
        from: r.deliveries.courierId,
        to: r.couriers.id,
      }),
    },
  }),
);
