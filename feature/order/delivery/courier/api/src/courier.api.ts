import { PickupRequest } from './courier.req';
import { Courier } from './courier.type';

export interface CourierApi {
  findById(req: { courierId: string }): Promise<{ courier: Courier }>;
  findByPhoneNumber(req: { phoneNumber: string }): Promise<{ courier: Courier }>;
  pickup(req: PickupRequest): Promise<void>;
}
