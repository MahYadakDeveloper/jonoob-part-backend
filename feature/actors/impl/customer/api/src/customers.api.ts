import { CustomerAddress } from '@feature/customer-address-api';
import { Customer, CustomerType, TechnicianSpecialty } from './customer.type';

export interface CustomersApi {
  findById(req: { customerId: string }): Promise<{ customer: Customer }>;

  findByPhoneNumber(req: {
    phoneNumber: string;
  }): Promise<{ customer: Customer }>;

  getContact(req: { customerId: string }): Promise<{
    customerContact: {
      type: CustomerType;
      phoneNumber: string;
      fullName: string;
    };
  }>;

  createConsumerTypeCustomer(req: {
    phoneNumber: string;
    fullName: string;
  }): Promise<{ id: string }>;

  createMerchantTypeCustomer(req: {
    phoneNumber: string;
    fullName: string;
    address: Extract<CustomerAddress, { scope: 'intra_city' }>;
  }): Promise<{ id: string }>;

  createTechnicianTypeCustomer(req: {
    phoneNumber: string;
    fullName: string;
    address: Extract<CustomerAddress, { scope: 'intra_city' }>;
    specialty: TechnicianSpecialty;
  }): Promise<{ id: string }>;
}
