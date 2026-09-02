import { LineItems } from '@feature/common';
import { Courier } from './model/courier';
import { Delivery } from '@feature/order-delivery-api';

export interface CourierRepository {
  findById(id: string): Promise<Courier>;
  findAll(): Promise<LineItems<Courier>>;

  addDelivery(courierId: string, deliveryId: string): Promise<void>;
  getDelivery(courierId: string, deliveryId: string): Promise<Delivery>;

  create(courier: Omit<Courier, 'id'>): Promise<void>;
  update(courier: Courier): Promise<void>;
  delete(id: string): Promise<void>;
}
