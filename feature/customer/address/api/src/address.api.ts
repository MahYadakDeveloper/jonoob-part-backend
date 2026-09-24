import { CustomerAddress } from './address.type';

export interface CustomerAddressApi {
  findById({
    addressId,
  }: {
    addressId: string;
  }): Promise<{ address: CustomerAddress }>;

  findManyByCustomerId({
    customerId,
  }: {
    customerId: string;
  }): Promise<{ addresses: CustomerAddress[] }>;
}
