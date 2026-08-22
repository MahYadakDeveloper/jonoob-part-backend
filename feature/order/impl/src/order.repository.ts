import { LineItems } from '@feature/common';
import { Order } from './model/order';

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findWaitingToSettleOrders(customerId: string): Promise<LineItems<Order>>;
  findOrderHandOverToCourier(
    orderId: string,
  ): Promise<Extract<
    Order,
    { status: 'handed-over-to-courier'; delivery: { scope: 'intra-city' } }
  > | null>;

  create(order: Omit<Order, 'orderId'>): Promise<string>;
}
