import { PartialBy, RequiredBy } from '@feature/common';
import { Delivery, Recipient } from '@feature/order-delivery-api';

/**
 * [NOTE]
 * Required 1-to-1 relation can also be created with a nested write.
 * Prisma creates the related records in the correct order.
 *
 * await prisma.user.create({
 *    data: {
 *    post: {
 *      create: { title: 'Hello' },
 *    },
 *  },
 * });
 *
 * so we don't need create method
 */
export interface DeliveryRepository {
  /**
   * [NOTE]
   * Create the `Delivery` in initial state
   */
  create(orderId: string, recipient: Recipient): Promise<void>;

  getOrderId(deliveryId: string): Promise<{ orderId: string }>;
  findByOrderId(orderId: string): Promise<{ id: string; orderId: string } & Delivery>;
  findById(deliveryId: string): Promise<{ id: string; orderId: string } & Delivery>;

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
