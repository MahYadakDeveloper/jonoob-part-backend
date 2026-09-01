import { LineItems } from '@feature/common';
import { Fulfillment } from '@feature/order-fulfillment-api';

export interface FulfillmentRepository {
  find(orderId: string): Promise<Fulfillment>;
  enqueue(orderId: string, data: Extract<Fulfillment, { status: 'processing' }>): Promise<void>;
  dequeue(orderId: string, data: Exclude<Fulfillment, { status: 'processing' }>): Promise<void>;
  list(): Promise<LineItems<Fulfillment>>;
}

/**
 * model in prisma their id would be orderId
 *
 */
