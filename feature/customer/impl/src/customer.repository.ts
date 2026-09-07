import { Customer } from './model/customer';

export interface CustomerRepository {
  find(id: string): Promise<Customer | null>;
}
