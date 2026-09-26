import { LineItems } from '@feature/common';
import { Order } from './model/order';

export interface OrderRepository {
  findByCustomerId(customerId: string): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  findBySessionId(
    sessionId: number,
  ): Promise<Extract<Order, { status: 'settlement' }>>;

  findByCustomerIdWithPaymentPendingStatus(
    customerId: string,
  ): Promise<LineItems<Order>>;

  findOrderHandOverToCourier(
    orderId: string,
  ): Promise<Extract<
    Order,
    { status: 'handed-over-to-courier'; delivery: { scope: 'intra-city' } }
  > | null>;

  create(
    data: Omit<
      Extract<Order, { status: 'settlement' }>,
      'id' | 'fulfillment' | 'payment' | 'delivery'
    >,
  ): Promise<string>;

  markAs(orderId: string, status: Order['status']): Promise<void>;

  // markAsPaid(
  //   id: string,
  //   data: PartialBy<
  //     Extract<Order, { status: 'process' }>,
  //     Extract<
  //       keyof Extract<Order, { status: 'settlement' }>,
  //       keyof Extract<Order, { status: 'process' }>
  //     >
  //   >,
  // ): Promise<void>;
}
