import { type CourierApi } from '@feature/courier-api';

@Injectable()
export class CourierService implements CourierApi {
  pickup(req: PickupRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }

  pickedUp() {
    // Dispatch handed over event
  }
}
