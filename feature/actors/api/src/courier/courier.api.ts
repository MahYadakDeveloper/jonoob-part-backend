export interface Courier {
  id: string;
  fullName: string;
  phone: string;
  password: string;
}

export const COURIER_API = Symbol('CourierApi');

export interface CourierApi {
  getById(courierId: string): Promise<Courier>;
  getByPhone(phone: string): Promise<Courier>;
  notifyPickup(deliveryId: string): Promise<void>;
}
