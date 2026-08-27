import {
  GetAllCustomerAddressesRequest,
  GetCustomerAddressRequest,
  GetCustomerContactRequest,
  RemoveCustomerAddressRequest,
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
  /**
   * [TODO]
   * Instead of exposing api method for adding address
   * the client can use api endpoint to directly add one
   */
  // addAddressForCustomer(req: AddAddressForCustomerRequest): Promise<void>;
  removeCustomerAddress(req: RemoveCustomerAddressRequest): Promise<void>;
}
