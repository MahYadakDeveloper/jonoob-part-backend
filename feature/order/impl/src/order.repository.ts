import { LineItems } from '@feature/common';
import { Order } from './model/order';

export interface OrderRepository {
  findOrderByCustomerId(customerId: string, orderId: string): Promise<Order | null>;
  find(id: string): Promise<Order | null>;
  getPaymentPendingOrders(customerId: string): Promise<LineItems<Order>>;
  findOrderHandOverToCourier(
    orderId: string,
  ): Promise<Extract<
    Order,
    { status: 'handed-over-to-courier'; delivery: { scope: 'intra-city' } }
  > | null>;

  create(data: Omit<Extract<Order, { status: 'recorded' }>, 'id'>): Promise<string>;

  markAsSettlementPending(orderId: string, sessionId: number): Promise<void>;
  markAs(orderId: string, status: Order['status']): Promise<void>;

  // updateOrderStatus<From extends Order['status'], To extends Order['status']>(
  //   id: string,
  //   data: PartialBy<
  //     Extract<Order, { status: To }>,
  //     Extract<keyof Extract<Order, { status: From }>, keyof Extract<Order, { status: To }>>
  //   >,
  // ): Promise<void>;
}
