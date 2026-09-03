import { Delivery, Recipient } from './delivery.type';

export interface DeliveryApi {
  create(req: { orderId: string; recipient: Recipient }): Promise<void>;
  deliver(req: { orderId: string }): Promise<void>;
  findDelivery(req: { orderId: string }): Promise<{ delivery: { id: string } & Delivery }>;
  cancelDelivery(req: { orderId: string }): Promise<void>;
}
