import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import { deliveries, orderRelations } from '@infra/db-drizzle/schema';
import { Recipient } from './delivery.dto';
import { AsyncLocalStorage } from 'async_hooks';

export class DeliveryRepository extends DrizzleBaseRepository<
  typeof orderRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof orderRelations>,
    forUpdateCtx: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, forUpdateCtx);
  }

  create(orderId: string, recipient: Recipient): Promise<void> {
    return this.db.select().from(deliveries).where();
  }

  getOrderId(deliveryId: string): Promise<{ orderId: string }>;
  findByOrderId(
    orderId: string,
  ): Promise<{ id: string; orderId: string } & Delivery>;
  findById(
    deliveryId: string,
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
