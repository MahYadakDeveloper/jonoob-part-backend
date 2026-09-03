import { LineItems } from '@feature/common';
import { Fulfillment } from '@feature/order-fulfillment-api';

export interface FulfillmentRepository {
  create(orderId: string, items: LineItems<{ goodId: string; quantity: number }>): Promise<void>;
  find(orderId: string): Promise<Fulfillment | null>;
  enqueue(orderId: string): Promise<void>;

  /**
   * fulfilledAt assigning is done repository impl
   */
  dequeue(
    orderId: string,
    as:
      | { status: 'fulfilled' }
      | { status: 'canceled_by_merchant'; reason: string }
      | { status: 'canceled_by_customer' },
  ): Promise<void>;
  list(): Promise<LineItems<Fulfillment>>;
}

/**
 * model in prisma their id would be orderId
 *
 */
