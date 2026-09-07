import { AddressType } from './address.type';

export interface AddressApi {
  findById({ addressId }: { addressId: string }): Promise<{ address: AddressType }>;
  findAddressesByCustomerId({
    customerId,
  }: {
    customerId: string;
  }): Promise<{ addresses: AddressType[] }>;
}
