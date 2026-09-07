import { type AddressApi } from '@feature/customer-address-api';
import {
  GetAllCustomerAddressesRequest,
  GetAllCustomerAddressesResponse,
  GetCustomerAddressRequest,
  GetCustomerAddressResponse,
  GetCustomerContactRequest,
  GetCustomerContactResponse,
  type CustomersApi,
} from '@feature/customer-api';
import { Injectable } from '@nestjs/common';
import { type CustomerRepository } from './customer.repository';

@Injectable()
export class CustomersService implements CustomersApi {
  constructor(
    private readonly repository: CustomerRepository,
    private readonly addresses: AddressApi,
  ) {}

  getCustomerContact(req: GetCustomerContactRequest): Promise<GetCustomerContactResponse> {
    return this.repository.find(req.customerId).then((customer) => {
      if (!customer) throw new Error();

      return {
        customer,
      };
    });
  }

  getCustomerAddress(req: GetCustomerAddressRequest): Promise<GetCustomerAddressResponse> {
    return this.repository.find(req.customerId).then((customer) => {
      if (!customer) throw new Error();
      const address = customer.addresses.find((a) => a.id === req.addressId);
      if (!address) throw new Error();
      return {
        address,
      };
    });
  }

  getAllCustomerAddresses(
    req: GetAllCustomerAddressesRequest,
  ): Promise<GetAllCustomerAddressesResponse> {
    return this.repository.find(req.customerId).then((customer) => {
      if (!customer) throw new Error();
      return {
        addresses: customer.addresses,
      };
    });
  }
}
