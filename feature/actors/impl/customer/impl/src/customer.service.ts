import type { TransactionManager } from '@feature/common';
import type {
  CustomerAddress,
  CustomerAddressApi,
} from '@feature/customer-address-api';
import {
  Customer,
  CustomerType,
  TechnicianSpecialty,
  type CustomersApi,
} from '@feature/customer-api';
import { Injectable } from '@nestjs/common';
import { type CustomerRepository } from './customer.repository';

@Injectable()
export class CustomersService implements CustomersApi {
  constructor(
    private readonly repository: CustomerRepository,
    private readonly addresses: CustomerAddressApi,
    private readonly tx: TransactionManager,
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
    customerContact: {
      type: CustomerType;
      phoneNumber: string;
      fullName: string;
    };
  }> {
    return this.repository.findById(customerId).then((customer) => {
      if (!customer) throw new Error('Customer not found!');
      return {
        customerContact: {
          fullName: customer.fullName,
          phoneNumber: customer.phoneNumber,
          type: customer.type,
        },
      };
    });
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

  createMerchantTypeCustomer({
    fullName,
    phoneNumber,
    address,
  }: {
    phoneNumber: string;
    fullName: string;
    address: Extract<CustomerAddress, { scope: 'intra_city' }>;
  }): Promise<{ id: string }> {
    return this.repository.create({
      type: 'merchant',
      fullName,
      phoneNumber,
      addresses: [address],
    });
  }

  createTechnicianTypeCustomer({
    fullName,
    phoneNumber,
    specialty,
    address,
  }: {
    phoneNumber: string;
    fullName: string;
    address: Extract<CustomerAddress, { scope: 'intra_city' }>;
    specialty: TechnicianSpecialty;
  }): Promise<{ id: string }> {
    return this.repository.create({
      type: 'technician',
      fullName,
      phoneNumber,
      specialty,
      addresses: [address],
    });
  }

  existsByPhoneNumber({
    phoneNumber,
  }: {
    phoneNumber: string;
  }): Promise<{ exists: boolean }> {
    return this.repository.findById(phoneNumber).then((c) => ({ exists: !!c }));
  }
}
