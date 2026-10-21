import { CustomerAddress } from '@feature/shared/types/customer-address';

export interface GetCustomerAddressInput {
  id: string;
  customerId: string;
}

export const CUSTOMER_ADDRESS_API = Symbol('CUSTOMER_ADDRESS_API');

export interface CustomerAddressApi {
  get(input: GetCustomerAddressInput): Promise<CustomerAddress>;
  list(customerId: string): Promise<CustomerAddress[]>;
}
