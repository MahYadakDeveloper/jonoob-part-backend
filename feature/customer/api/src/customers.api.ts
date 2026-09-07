import {
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
  getCustomerContact(req: GetCustomerContactRequest): Promise<GetCustomerContactResponse>;

  getCustomerAddress(req: GetCustomerAddressRequest): Promise<GetCustomerAddressResponse>;
  getAllCustomerAddresses(
    req: GetAllCustomerAddressesRequest,
  ): Promise<GetAllCustomerAddressesResponse>;
}
