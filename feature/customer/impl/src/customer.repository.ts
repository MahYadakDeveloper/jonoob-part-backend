import { LockableRepository } from '@feature/common';
import { Customer } from '@feature/customer-api';

export interface CustomerRepository extends LockableRepository {
  findById(id: string): Promise<Customer | null>;
  findByPhoneNumber(phoneNumber: string): Promise<Customer | null>;

  create(data: Omit<Customer, 'id' | 'addresses'>): Promise<{ id: string }>;

  existsById(id: string): Promise<{ exists: boolean }>;
  existsByPhoneNumber(phoneNumber: string): Promise<{ exists: boolean }>;
}
