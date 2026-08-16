import { CustomerAddress } from './customer.type';

export interface AddAddressRequest {
  address: CustomerAddress;
}

export interface RemoveAddressRequest {
  addressId: string;
}
