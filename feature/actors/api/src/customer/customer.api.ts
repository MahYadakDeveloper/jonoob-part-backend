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

export interface GetCustomerByIdInput {
  customerId: string;
}

export interface GetCustomerByPhoneInput {
  phone: string;
}

export const CUSTOMERS_API = Symbol('CUSTOMERS_API');

export interface CustomersApi {
  getById(input: GetCustomerByIdInput): Promise<Customer>;
  getByPhone(input: GetCustomerByPhoneInput): Promise<Customer>;
  createConsumerTypeCustomer(
    input: CreateConsumerTypeCustomerInput,
  ): Promise<{ id: string }>;
}
