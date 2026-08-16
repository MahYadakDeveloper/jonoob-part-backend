import { LineItems } from '@feature/common';
import { CustomerAddress } from './customer.type';

export interface ListAddressResponse {
  addresses: LineItems<CustomerAddress>;
}
