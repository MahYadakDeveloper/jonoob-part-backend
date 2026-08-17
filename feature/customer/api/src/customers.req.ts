import { CustomerAddress } from './customer.type';

export interface AddAddressForCustomerRequest {
  customerId: string;
  address: CustomerAddress;
}

export interface GetCustomerAddressRequest {
  customerId: string;
  addressId: string;
}

export interface GetAllCustomerAddressesRequest {
  customerId: string;
}

export interface RemoveCustomerAddressRequest {
  customerId: string;
  addressId: string;
}

export interface FindCustomerByIdRequest {
  customerId: string;
}
