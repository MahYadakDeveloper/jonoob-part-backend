import { Courier } from './courier';

export const COURIER_API = Symbol('CourierApi');
export interface CourierApi {
  findById(courierId: string): Promise<Courier>;
  findByPhoneNumber(phone: string): Promise<Courier>;
  notifyPickup(deliveryId: string): Promise<void>;
}
