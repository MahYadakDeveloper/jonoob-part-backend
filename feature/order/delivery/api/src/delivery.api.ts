import { DeliveryAttemptRequest } from './delivery.req';
import { Delivery } from './delivery.type';

export interface DeliveryApi {
  findDelivery(req: { orderId: string }): Promise<{ delivery: { id: string } & Delivery }>;
  reportDeliveryAttempt(request: DeliveryAttemptRequest): Promise<void>;
}
