import { LineItems } from '@feature/common';
import { Customer, CustomerAddress } from './customer.type';

export interface GetAllCustomerAddressesResponse {
  addresses: LineItems<CustomerAddress>;
}

export interface FindCustomerByIdResponse {
  customer: Customer;
}

export interface GetCustomerAddressResponse {
  address: CustomerAddress;
}
