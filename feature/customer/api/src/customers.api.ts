import {
  AddAddressForCustomerRequest,
  FindCustomerByIdRequest,
  GetAllCustomerAddressesRequest,
  GetCustomerAddressRequest,
  RemoveCustomerAddressRequest,
} from './customers.req';
import {
  FindCustomerByIdResponse,
  GetAllCustomerAddressesResponse,
  GetCustomerAddressResponse,
} from './customers.res';

export interface CustomersApi {
  findById(req: FindCustomerByIdRequest): Promise<FindCustomerByIdResponse>;

  getCustomerAddress(req: GetCustomerAddressRequest): Promise<GetCustomerAddressResponse>;
  getAllCustomerAddresses(
    req: GetAllCustomerAddressesRequest,
  ): Promise<GetAllCustomerAddressesResponse>;
  addAddressForCustomer(req: AddAddressForCustomerRequest): Promise<void>;
  removeCustomerAddress(req: RemoveCustomerAddressRequest): Promise<void>;
}
