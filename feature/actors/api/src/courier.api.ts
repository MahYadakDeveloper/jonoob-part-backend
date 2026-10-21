export interface Courier {
  id: string;
  fullName: string;
  phone: string;
  password: string;
}

export interface GetCourierByIdInput {
  courierId: string;
}

export interface GetCourierByPhoneInput {
  phone: string;
}

export interface NotifyCouriersForPickupInput {
  deliveryId: string;
}

export const COURIER_API = Symbol('COURIER_API');

export interface CourierApi {
  getById(input: GetCourierByIdInput): Promise<Courier>;
  getByPhone(input: GetCourierByPhoneInput): Promise<Courier>;
  notifyPickup(input: NotifyCouriersForPickupInput): Promise<void>;
}
