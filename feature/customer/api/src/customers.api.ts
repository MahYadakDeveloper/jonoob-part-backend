import { AddAddressRequest, RemoveAddressRequest } from './customers.req';
import { ListAddressResponse } from './customers.res';

export interface CustomersApi {
  addAddress(req: AddAddressRequest): Promise<void>;
  removeAddress(req: RemoveAddressRequest): Promise<void>;
  listAddress(): Promise<ListAddressResponse>;
}
