import { Customer, CustomerType } from './customer.type';

export const CUSTOMER_API = Symbol('CustomersApi');
export interface CustomersApi {
  findById(customerId: string): Promise<Customer>;

  findByPhone(phone: string): Promise<Customer>;

  getContact(
    customerId: string,
  ): Promise<{ type: CustomerType; phone: string; fullName: string }>;

  createConsumerTypeCustomer(customer: {
    phone: string;
    fullName: string;
  }): Promise<{ id: string }>;
}
