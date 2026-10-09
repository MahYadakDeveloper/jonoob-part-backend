import {
  Customer,
  CustomerAddress,
  CustomersApi,
  CustomerType,
  TechnicianSpecialty,
} from '@feature/actors-api/customer';
import { CustomerRepository } from './customer.repository';

export class CustomersApiImpl implements CustomersApi {
  constructor(private readonly repository: CustomerRepository) {}
  findById(customerId: string): Promise<Customer> {
    throw new Error('Method not implemented.');
  }
  findByPhoneNumber(phone: string): Promise<Customer> {
    throw new Error('Method not implemented.');
  }
  getContact(customerId: string): Promise<{
    type: CustomerType;
    phoneNumber: string;
    fullName: string;
  }> {
    throw new Error('Method not implemented.');
  }
  createConsumerTypeCustomer(customer: {
    phoneNumber: string;
    fullName: string;
  }): Promise<{ id: string }> {
    throw new Error('Method not implemented.');
  }
  createMerchantTypeCustomer(customer: {
    phoneNumber: string;
    fullName: string;
    address: Extract<CustomerAddress, { scope: 'intra_city' }>;
  }): Promise<{ id: string }> {
    throw new Error('Method not implemented.');
  }
  createTechnicianTypeCustomer(customer: {
    phoneNumber: string;
    fullName: string;
    address: Extract<CustomerAddress, { scope: 'intra_city' }>;
    specialty: TechnicianSpecialty;
  }): Promise<{ id: string }> {
    throw new Error('Method not implemented.');
  }
}
