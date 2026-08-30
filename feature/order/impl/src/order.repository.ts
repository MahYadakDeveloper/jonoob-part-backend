import { LineItems, PartialBy } from '@feature/common';
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

  updateOrderStatus<From extends Order['status'], To extends Order['status']>(
    data: PartialBy<
      Extract<Order, { status: To }>,
      Extract<keyof Extract<Order, { status: From }>, keyof Extract<Order, { status: To }>>
    >,
  ): Promise<void>;
}
