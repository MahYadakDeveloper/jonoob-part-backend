import { Delivery } from './delivery.type';

export interface DeliveryApi {
  findDelivery(req: { orderId: string }): Promise<{ delivery: { id: string } & Delivery }>;
}
