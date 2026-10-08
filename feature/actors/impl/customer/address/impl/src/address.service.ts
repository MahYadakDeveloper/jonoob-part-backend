import { PartialBy } from '@feature/common';
import {
  CustomerAddress,
  CustomerAddressApi,
} from '@feature/customer-address-api';
import { Injectable } from '@nestjs/common';
import { CreateAddress, type AddressRepository } from './address.repository';

@Injectable()
export class AddressService implements CustomerAddressApi {
  constructor(private readonly repository: AddressRepository) {}

  findByCustomerId({ customerId }: { customerId: string }): Promise<{
    addresses: CustomerAddress[];
  }> {
    return this.repository.findByCustomerId(customerId).then((addresses) => ({
      addresses,
    }));
  }

  findById({ addressId }: { addressId: string }): Promise<{
    address: CustomerAddress;
  }> {
    return this.repository.findById(addressId).then((address) => {
      if (!address) throw new Error();
      return { address };
    });
  }

  async create(req: CreateAddress): Promise<void> {
    await this.repository.create(req);
  }

  updateByCustomerIdAndId(req: {
    customerId: string;
    addressId: string;
    data: PartialBy<CustomerAddress, 'id'>;
  }): Promise<void> {
    return this.repository.updateByCustomerIdAndId(
      req.customerId,
      req.addressId,
      req.data,
    );
  }

  deleteByCustomerIdAndId({
    addressId,
    customerId,
  }: {
    customerId: string;
    addressId: string;
  }): Promise<void> {
    return this.repository.deleteByCustomerIdAndId(customerId, addressId);
  }
}
