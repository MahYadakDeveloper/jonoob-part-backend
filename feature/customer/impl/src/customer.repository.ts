import { LockableRepository, PartialBy } from '@feature/common';
import { Customer } from '@feature/customer-api';

export interface CustomerRepository extends LockableRepository {
  findById(id: string): Promise<Customer | null>;
  findByPhoneNumber(phoneNumber: string): Promise<Customer | null>;

  create(
    data: PartialBy<Customer, 'id' | 'wallet' | 'addresses'>,
  ): Promise<{ id: string }>;
}
