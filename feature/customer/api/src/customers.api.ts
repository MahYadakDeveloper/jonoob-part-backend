import { Customer } from './customer.type';
import {
  CustomerCreationRequest,
  GetAllCustomerAddressesRequest,
  GetCustomerAddressRequest,
  GetCustomerContactRequest,
} from './customers.req';
import {
  GetAllCustomerAddressesResponse,
  GetCustomerAddressResponse,
  GetCustomerContactResponse,
} from './customers.res';

export interface CustomersApi {
  findByPhoneNumber(req: { phoneNumber: string }): Promise<{ customer: { id: string } & Customer }>;

  getCustomerContact(req: GetCustomerContactRequest): Promise<GetCustomerContactResponse>;

  getCustomerAddress(req: GetCustomerAddressRequest): Promise<GetCustomerAddressResponse>;
  getAllCustomerAddresses(
    req: GetAllCustomerAddressesRequest,
  ): Promise<GetAllCustomerAddressesResponse>;

  create(req: CustomerCreationRequest): Promise<{ id: string }>;

  existsByPhoneNumber(req: { phoneNumber: string }): Promise<{ exists: boolean }>;
}
