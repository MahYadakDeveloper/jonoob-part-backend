// export interface AddAddressForCustomerRequest {
//   customerId: string;
//   address: CustomerAddress;
// }

import { PartialBy } from '@feature/common';
import { Customer } from './customer.type';

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

export interface GetCustomerContactRequest {
  customerId: string;
}

export type CustomerCreationRequest = PartialBy<Customer, 'addresses'>;
