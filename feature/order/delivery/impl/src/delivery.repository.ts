import { Delivery } from '@feature/order-delivery-api';

export interface DeliveryRepository {
  find(orderId: string): Promise<Delivery>;
}
