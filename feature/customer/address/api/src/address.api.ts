import { PartialBy } from '@feature/common';
import { CustomerAddress } from './address.type';

export interface CustomerAddressApi {
  findById(req: { addressId: string }): Promise<{ address: CustomerAddress }>;

  findByCustomerId(req: {
    customerId: string;
  }): Promise<{ addresses: CustomerAddress[] }>;
}
