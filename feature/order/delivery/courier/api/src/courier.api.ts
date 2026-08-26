import { CancelPickupRequest, PickupRequest } from './courier.req';

export interface CourierApi {
  pickup(req: PickupRequest): Promise<void>;
  cancelPickupRequest(req: CancelPickupRequest): Promise<void>;
}
