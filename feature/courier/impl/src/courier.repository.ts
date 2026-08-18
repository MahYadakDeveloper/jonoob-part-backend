import { LineItems } from '@feature/common';
import { Courier } from './model/courier';

export interface CourierRepository {
  findById(id: string): Promise<Courier>;
  findAll(): Promise<LineItems<Courier>>;

  addActiveDelivery(courierId: string, orderId: string): Promise<void>;

  create(courier: Omit<Courier, 'id'>): Promise<void>;
  update(courier: Courier): Promise<void>;
  delete(id: string): Promise<void>;
}
