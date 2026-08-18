import { Order } from './model/order';

export interface OrderRepository {
  findById(id: string): Promise<Order>;

  create(order: Omit<Order, 'orderId'>): Promise<string>;
}
