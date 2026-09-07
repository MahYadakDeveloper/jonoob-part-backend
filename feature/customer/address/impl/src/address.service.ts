import { AddAddressRequest, AddressApi, AddressType } from '@feature/customer-address-api';
import { type DeliveryApi } from '@feature/order-delivery-api';
import { Injectable } from '@nestjs/common';
import { type AddressRepository } from './address.repository';

@Injectable()
export class AddressService implements AddressApi {
  constructor(
    private readonly delivery: DeliveryApi,
    private readonly repository: AddressRepository,
  ) {}

  findById({ addressId }: { addressId: string }): Promise<{
    address: AddressType;
  }> {
    return this.repository.find(addressId).then((address) => {
      if (!address) throw new Error();
      return { address };
    });
  }

  findAddressesByCustomerId({ customerId }: { customerId: string }): Promise<{
    addresses: AddressType[];
  }> {
    return this.repository.findByCustomerId(customerId).then((addresses) => ({
      addresses,
    }));
  }

  async addAddress(req: AddAddressRequest): Promise<void> {
    const { scope } = this.delivery.resolveScope({
      provinceId: req.provinceId,
      cityId: req.cityId,
    });

    if (req.scope !== scope) throw new Error();

    await this.repository.create(req.customerId, req);
  }

  removeAddress({ addressId }: { addressId: string }): Promise<void> {
    return this.repository.delete(addressId);
  }
}
