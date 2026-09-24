import type {
  CustomerAddress,
  CustomerAddressApi,
} from '@feature/customer-address-api';
import {
  Customer,
  CustomerType,
  type CustomersApi,
} from '@feature/customer-api';
import { Injectable } from '@nestjs/common';
import { type CustomerRepository } from './customer.repository';

@Injectable()
export class CustomersService implements CustomersApi {
  constructor(
    private readonly repository: CustomerRepository,
    private readonly addresses: CustomerAddressApi,
  ) {}

  async findById({ customerId }: { customerId: string }): Promise<{
    customer: Customer;
  }> {
    return this.repository.findById(customerId).then((customer) => {
      if (!customer) throw new Error('Customer not found!');
      return { customer };
    });
  }

  findByPhoneNumber({ phoneNumber }: { phoneNumber: string }): Promise<{
    customer: Customer;
  }> {
    return this.repository.findByPhoneNumber(phoneNumber).then((customer) => {
      if (!customer) throw new Error('Customer not found!');
      return { customer };
    });
  }

  getContact({ customerId }: { customerId: string }): Promise<{
    customerContract: {
      type: CustomerType;
      phoneNumber: string;
      fullName: string;
    };
  }> {
    return this.repository.findById(customerId).then((customer) => {
      if (!customer) throw new Error('Customer not found!');
      return {
        customerContract: {
          fullName: customer.fullName,
          phoneNumber: customer.phoneNumber,
          type: customer.type,
        },
      };
    });
  }

  getAddresses({ customerId }: { customerId: string }): Promise<{
    addresses: CustomerAddress[];
  }> {
    return this.addresses.findManyByCustomerId({ customerId });
  }

  createConsumerTypeCustomer({
    fullName,
    phoneNumber,
  }: {
    phoneNumber: string;
    fullName: string;
  }): Promise<{ id: string }> {
    return this.repository.create({
      fullName,
      phoneNumber,
      type: 'consumer',
    });
  }

  existsById({
    customerId,
  }: {
    customerId: string;
  }): Promise<{ exists: boolean }> {
    return this.repository.existsById(customerId);
  }

  existsByPhoneNumber({
    phoneNumber,
  }: {
    phoneNumber: string;
  }): Promise<{ exists: boolean }> {
    return this.repository.existsByPhoneNumber(phoneNumber);
  }
}
