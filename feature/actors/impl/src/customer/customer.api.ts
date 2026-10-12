import {
  Customer as CustomerDto,
  CustomersApi,
  CustomerType,
} from '@feature/actors-api/customer';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Customer, CustomerRepository } from './customer.repository';

@Injectable()
export class CustomersApiImpl implements CustomersApi {
  constructor(private readonly repository: CustomerRepository) {}

  async findById(customerId: string): Promise<CustomerDto> {
    return this.repository.findById(customerId).then((c) => {
      if (!c) throw new NotFoundException(`Customer ${customerId} not found!`);
      return toCustomerDto(c);
    });
  }

  findByPhone(phone: string): Promise<CustomerDto> {
    return this.repository.findByPhone(phone).then((c) => {
      if (!c)
        throw new NotFoundException(`Customer with ${phone} phone not found!`);
      return toCustomerDto(c);
    });
  }

  getContact(customerId: string): Promise<{
    type: CustomerType;
    phone: string;
    fullName: string;
  }> {
    return this.repository.findById(customerId).then((c) => {
      if (!c) throw new NotFoundException('Customer not found!');
      return {
        fullName: c.fullName,
        phone: c.phone,
        type: c.type,
      };
    });
  }

  createConsumerTypeCustomer({
    fullName,
    phone,
  }: {
    phone: string;
    fullName: string;
  }): Promise<{ id: string }> {
    return this.repository.create({
      fullName,
      phone,
      type: 'consumer',
    });
  }
}

type Addr<S extends CustomerDto['addresses'][0]['scope']> = Extract<
  CustomerDto['addresses'][0]['scope'],
  { scope: S }
>[];

export function toCustomerDto(c: Customer): CustomerDto {
  const base = { id: c.id, fullName: c.fullName, phone: c.phone };

  switch (c.type) {
    case 'consumer':
      return {
        ...base,
        type: c.type,
        addresses: c.addresses as Addr<'inter_city'>,
      };
    case 'merchant':
      return {
        ...base,
        type: c.type,
        addresses: c.addresses as Addr<'intra_city'>,
      };
    case 'technician':
      return {
        ...base,
        type: c.type,
        specialty: c.specialty!,
        addresses: c.addresses as Addr<'intra_city'>,
      };
  }
}
