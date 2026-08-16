import { DeliveryAttemptRequest } from './delivery.req';

export interface DeliveryApi {
  reportDeliveryAttempt(request: DeliveryAttemptRequest): Promise<void>;
}
