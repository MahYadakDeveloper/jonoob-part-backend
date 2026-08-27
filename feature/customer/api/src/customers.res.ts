import { CustomerAddress, CustomerContact, LineItems } from '@feature/common';

export interface GetAllCustomerAddressesResponse {
  addresses: LineItems<CustomerAddress>;
}

export interface GetCustomerContactResponse {
  customer: CustomerContact;
}

export interface GetCustomerAddressResponse {
  address: CustomerAddress;
}
