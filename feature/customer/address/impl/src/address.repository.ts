import { CustomerAddress } from '@feature/common';
import { AddressType } from '@feature/customer-address-api';

export interface AddressRepository {
  find(id: string): Promise<AddressType | null>;
  findByCustomerId(customerId: string): Promise<AddressType[]>;
  create(customerId: string, data: CustomerAddress): Promise<void>;

  delete(id: string): Promise<void>;
}
