import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import { deliveries, orderRelations } from '@infra/db-drizzle/schema';
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

  findById(deliveryId: string): Promise<Delivery | null> {
    return this.db
      .select()
      .from(deliveries)
      .then(([row]) => (!!row ? toDelivery(row) : null));
  }

  findAll(): Promise<Delivery[]> {
    return this.db
      .select()
      .from(deliveries)
      .then((rows) => rows.map(toDelivery));
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
