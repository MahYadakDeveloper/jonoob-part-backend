import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import {
  deliveries,
  deliveryAttemptReports,
  orderRelations,
} from '@infra/db-drizzle/schema';
import { AsyncLocalStorage } from 'async_hooks';
import { eq } from 'drizzle-orm';
import { Delivery } from './delivery';
import { toDelivery } from './delivery.mapper';

export class DeliveryRepository extends DrizzleBaseRepository<
  typeof orderRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof orderRelations>,
    forUpdateCtx: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, forUpdateCtx);
  }

  findAssignedCourierId(deliveryId: string): Promise<string | null> {
    return this.db
      .select({ courierId: deliveries.courierId })
      .from(deliveries)
      .where(eq(deliveries.id, deliveryId))
      .then(([row]) => row.courierId);
  }

  findById(id: string) {
    return this.db.query.deliveries
      .findFirst({
        where: {
          id,
        },
        with: {
          attempts: true,
          courier: true,
        },
      })
      .then((d) => d ?? null);
  }

  findAll() {
    return this.db.select().from(deliveries);
  }

  update(
    deliveryId: string,
    data: Partial<Omit<typeof deliveries.$inferInsert, 'id'>>,
  ) {
    return this.db
      .update(deliveries)
      .set(data)
      .where(eq(deliveries.id, deliveryId))
      .returning({ id: deliveries.id });
  }

  createDeliveryAttemptReport(
    report: Omit<typeof deliveryAttemptReports.$inferInsert, 'scope'>,
  ) {
    return this.db
      .select({ scope: deliveries.scope })
      .from(deliveries)
      .where(eq(deliveries.id, report.deliveryId))
      .then(([delivery]) => {
        if (!delivery?.scope) {
          throw new Error(
            `Cannot create delivery attempt report: delivery ${report.deliveryId} was not found`,
          );
        }

        return this.db
          .insert(deliveryAttemptReports)
          .values({ ...report, scope: delivery.scope })
          .returning({ id: deliveryAttemptReports.id });
      });
  }

  getOrderId(deliveryId: string): Promise<{ orderId: string }>;
  findByOrderId(
    orderId: string,
  ): Promise<{ id: string; orderId: string } & Delivery>;

  markAsCourierRequested(
    deliveryId: string,
    data: PartialBy<
      Extract<Delivery, { status: 'courier_requested' }>,
      Extract<
        keyof Extract<Delivery, { status: 'courier_requested' }>,
        keyof Extract<Delivery, { status: 'handed_over_to_courier' }>
      >
    >,
  ): Promise<void>;

  markAsCanceled(
    deliveryId: string,
    data: PartialBy<
      Extract<Delivery, { status: 'canceled' }>,
      Extract<
        keyof Extract<Delivery, { status: 'canceled' }>,
        keyof Extract<Delivery, { status: 'handed_over_to_courier' }>
      >
    >,
  ): Promise<void>;

  markAsHandedOverToCourier(
    deliveryId: string,
    data: RequiredBy<
      PartialBy<
        Extract<Delivery, { status: 'handed_over_to_courier' }>,
        Extract<
          keyof Extract<Delivery, { status: 'handed_over_to_courier' }>,
          keyof Extract<Delivery, { status: 'courier_requested' }>
        >
      >,
      'recipient'
    >,
  ): Promise<void>;

  markAsDelivered(
    deliveryId: string,
    data: RequiredBy<
      PartialBy<
        Extract<Delivery, { status: 'delivered' }>,
        Extract<
          keyof Extract<Delivery, { status: 'delivered' }>,
          keyof Extract<Delivery, { status: 'handed_over_to_courier' }>
        >
      >,
      'recipient'
    >,
  ): Promise<void>;

  markAsReturnedToWarehouse(
    deliveryId: string,
    data: RequiredBy<
      PartialBy<
        Extract<Delivery, { status: 'returned_to_warehouse' }>,
        Extract<
          keyof Extract<Delivery, { status: 'returned_to_warehouse' }>,
          keyof Extract<Delivery, { status: 'handed_over_to_courier' }>
        >
      >,
      'recipient'
    >,
  ): Promise<void>;
}
