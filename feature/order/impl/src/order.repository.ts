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

  create(data: Omit<Extract<Order, { status: 'settlement' }>, 'id' | 'payment'>): Promise<string>;

  updateOrderToSettlementStatus(order: Extract<Order, { status: 'settlement' }>): Promise<void>;
  updateOrderToCanceledStatus(order: Extract<Order, { status: 'canceled' }>): Promise<void>;
  updateOrderToCanceledByAdminStatus(
    order: Extract<Order, { status: 'canceled_by_admin' }>,
  ): Promise<void>;

  updateOrderStatusTo<T extends Order['status']>(
    order: Extract<Order, { status: T }>,
  ): Promise<void>;
}
