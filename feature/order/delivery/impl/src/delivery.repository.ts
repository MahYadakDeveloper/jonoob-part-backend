import { PartialBy } from '@feature/common';
import { Delivery } from '@feature/order-delivery-api';

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
  getOrderId(deliveryId: string): Promise<{ orderId: string }>;
  findByOrderId(orderId: string): Promise<{ id: string; orderId: string } & Delivery>;
  findById(deliveryId: string): Promise<{ id: string; orderId: string } & Delivery>;

  markAsHandedOverToCourier(
    deliveryId: string,
    data: PartialBy<
      Extract<Delivery, { status: 'handed-over-to-courier' }>,
      Extract<
        keyof Extract<Delivery, { status: 'handed-over-to-courier' }>,
        keyof Extract<Delivery, { status: 'courier-requested' }>
      >
    >,
  ): Promise<void>;

  markAsReturnedToWarehouse(
    deliveryId: string,
    data: PartialBy<
      Extract<Delivery, { status: 'returned-to-warehouse' }>,
      Extract<
        keyof Extract<Delivery, { status: 'returned-to-warehouse' }>,
        keyof Extract<Delivery, { status: 'handed-over-to-courier' }>
      >
    >,
  ): Promise<void>;
}
