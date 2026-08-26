import { Customer, CustomerAddress, LineItems } from '@feature/common';

export interface GetAllCustomerAddressesResponse {
  addresses: LineItems<CustomerAddress>;
}

export interface FindCustomerByIdResponse {
  customer: Customer;
}

export interface GetCustomerAddressResponse {
  address: CustomerAddress;
}
