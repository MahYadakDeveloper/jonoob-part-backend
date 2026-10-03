import { defineRelationsPart } from 'drizzle-orm';
import * as schema from './tables/index';

export const warehouseRelations = defineRelationsPart(schema, (r) => ({
  reservations: {
    items: r.many.reservationItems(),
  },
  reservationItems: {
    reservation: r.one.reservations({
      from: r.reservationItems.reservationId,
      to: r.reservations.id,
    }),
  },
}));
