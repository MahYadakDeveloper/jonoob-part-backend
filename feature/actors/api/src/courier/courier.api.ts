import { Courier } from './courier';

export const COURIER_API = Symbol('CourierApi');
export interface CourierApi {
  findById(courierId: string): Promise<Courier>;
  findByPhone(phone: string): Promise<Courier>;
  notifyPickup(deliveryId: string): Promise<void>;
}
