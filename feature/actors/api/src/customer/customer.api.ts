import { CustomerType } from '@feature/shared/types/customer-type';

export type Customer = {
  id: string;
  fullName: string;
  phone: string;
  type: CustomerType;
};

export type CustomerContact = {
  type: CustomerType;
  phone: string;
  fullName: string;
};

export interface CreateConsumerTypeCustomerInput {
  fullName: string;
  phone: string;
}

export const CUSTOMERS_API = Symbol('CUSTOMERS_API');

export interface CustomersApi {
  getById(id: string): Promise<Customer>;

  getByPhone(phone: string): Promise<Customer>;

  createConsumerTypeCustomer(
    input: CreateConsumerTypeCustomerInput,
  ): Promise<{ id: string }>;
}
