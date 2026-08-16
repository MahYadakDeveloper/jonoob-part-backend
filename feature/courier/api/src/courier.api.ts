import { PickupRequest } from './courier.req';

export interface CourierApi {
  pickup(req: PickupRequest): Promise<void>;
}
