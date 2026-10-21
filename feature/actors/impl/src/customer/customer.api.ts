import { Customer, CustomersApi } from '@feature/actors-api/customer';
import { ensureFound, ensureOne } from '@feature/shared/utils/assertions';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerRepository } from './customer.repository';

@Injectable()
export class CustomersApiImpl implements CustomersApi {
  constructor(private readonly repository: CustomerRepository) {}

  getById(customerId: string): Promise<Customer> {
    return this.repository
      .findById(customerId)
      .then((c) =>
        ensureFound(c, () => new NotFoundException('Customer not found!')),
      );
  }

  getByPhone(phone: string): Promise<Customer> {
    return this.repository
      .findByPhone(phone)
      .then((c) =>
        ensureFound(c, () => new NotFoundException('Customer not found!')),
      );
  }

  createConsumerTypeCustomer(
    phone: string,
    fullName: string,
  ): Promise<{ id: string }> {
    return this.repository
      .create({
        fullName,
        phone,
        type: 'consumer',
      })
      .then((c) => ensureOne(c, () => new Error())[0]);
  }
}
