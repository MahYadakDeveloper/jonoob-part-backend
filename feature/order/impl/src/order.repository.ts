import { LineItems } from '@feature/common';
import { Order } from './model/order';

export type OrderCreate = Omit<Order, 'id'>;

export interface OrderRepository {
  findOrderByCustomerId(customerId: string, orderId: string): Promise<Order | null>;
  find(id: string): Promise<Order | null>;
  findWaitingToSettleOrders(customerId: string): Promise<LineItems<Order>>;
  findOrderHandOverToCourier(
    orderId: string,
  ): Promise<Extract<
    Order,
    { status: 'handed-over-to-courier'; delivery: { scope: 'intra-city' } }
  > | null>;

  create(order: OrderCreate): Promise<string>;

  updateOrderToSettlementStatus(order: Extract<Order, { status: 'settlement' }>): Promise<void>;
  updateOrderToCanceledStatus(order: Extract<Order, { status: 'canceled' }>): Promise<void>;
  updateOrderToCanceledByAdminStatus(
    order: Extract<Order, { status: 'canceled_by_admin' }>,
  ): Promise<void>;
}
