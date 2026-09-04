import { Delivery, Recipient } from './delivery.type';

export interface DeliveryApi {
  initialize(req: { orderId: string; recipient: Recipient }): Promise<void>;
  deliver(req: { orderId: string }): Promise<void>;
  findOne(req: { deliveryId: string }): Promise<{ delivery: { id: string } & Delivery }>;
  cancelDelivery(req: { orderId: string }): Promise<void>;
}
