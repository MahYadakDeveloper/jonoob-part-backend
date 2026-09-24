import { CustomerAddress } from '@feature/customer-address-api';
import { Customer, CustomerType } from './customer.type';

export interface CustomersApi {
  findById(req: { customerId: string }): Promise<{ customer: Customer }>;

  findByPhoneNumber(req: {
    phoneNumber: string;
  }): Promise<{ customer: Customer }>;

  getContact(req: { customerId: string }): Promise<{
    customerContract: {
      type: CustomerType;
      phoneNumber: string;
      fullName: string;
    };
  }>;

  getAddresses(req: {
    customerId: string;
  }): Promise<{ addresses: CustomerAddress[] }>;

  createConsumerTypeCustomer(req: {
    phoneNumber: string;
    fullName: string;
  }): Promise<{ id: string }>;

  existsById(req: { customerId: string }): Promise<{ exists: boolean }>;
  existsByPhoneNumber(req: {
    phoneNumber: string;
  }): Promise<{ exists: boolean }>;
}
