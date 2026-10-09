import { PartialBy } from '@feature/common';
import { CustomerAddress } from '@feature/customer-address-api';

export type Address = { customerId: string } & CustomerAddress;
export type CreateAddress = PartialBy<Address, 'id'>;

export interface AddressRepository {
  findById(id: string): Promise<CustomerAddress | null>;
  findByCustomerId(customerId: string): Promise<CustomerAddress[]>;

  create(data: CreateAddress): Promise<void>;

  updateByCustomerIdAndId(
    customerId: string,
    addressId: string,
    data: PartialBy<CustomerAddress, 'id'>,
  ): Promise<void>;

  deleteByCustomerIdAndId(customerId: string, addressId: string): Promise<void>;
}
