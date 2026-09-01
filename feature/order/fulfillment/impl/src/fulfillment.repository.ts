import { LineItems } from '@feature/common';
import { Fulfillment } from '@feature/order-fulfillment-api';

export interface FulfillmentRepository {
  enqueue(orderId: string): Promise<void>;
  listReadyForProcessing(): Promise<LineItems<Fulfillment>>;
}
