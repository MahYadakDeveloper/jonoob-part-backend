import {
  Customer,
  CustomerAddress,
  CustomerType,
  TechnicianSpecialty,
} from './customer.type';

export const CUSTOMER_API = Symbol('CustomersApi');
export interface CustomersApi {
  findById(customerId: string): Promise<Customer>;

  findByPhoneNumber(phone: string): Promise<Customer>;

  getContact(
    customerId: string,
  ): Promise<{ type: CustomerType; phoneNumber: string; fullName: string }>;

  createConsumerTypeCustomer(customer: {
    phoneNumber: string;
    fullName: string;
  }): Promise<{ id: string }>;

  createMerchantTypeCustomer(customer: {
    phoneNumber: string;
    fullName: string;
    address: Extract<CustomerAddress, { scope: 'intra_city' }>;
  }): Promise<{ id: string }>;

  createTechnicianTypeCustomer(customer: {
    phoneNumber: string;
    fullName: string;
    address: Extract<CustomerAddress, { scope: 'intra_city' }>;
    specialty: TechnicianSpecialty;
  }): Promise<{ id: string }>;
}
