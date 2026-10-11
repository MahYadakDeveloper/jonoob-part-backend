import { CustomerAddress } from './customer.type';

export interface CustomerAddressApi {
  findManyByCustomerId(customerId: string): Promise<CustomerAddress[]>;

  findByIdAndCustomerId(
    addressId: string,
    customerId: string,
  ): Promise<CustomerAddress>;
}
