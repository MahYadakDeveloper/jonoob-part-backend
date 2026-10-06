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

  movements: {
    quarantines: r.many.quarantines(),
  },

  barcode: {},

  stocks: {
    barcode: r.one.barcode({
      from: r.stocks.id,
      to: r.barcode.stockId,
      optional: false,
    }),
    reservedQty: r.many.reservationItems({
      from: r.stocks.id,
      to: r.reservationItems.stockId,
    }),
  },

  quarantines: {
    stock: r.one.stocks({
      from: r.quarantines.stockId,
      to: r.stocks.id,
      optional: false,
    }),

    movement: r.one.movements({
      from: r.quarantines.movementId,
      to: r.movements.id,
      optional: false,
    }),
  },
}));
