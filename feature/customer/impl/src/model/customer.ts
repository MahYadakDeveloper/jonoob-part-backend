import { CustomerAddress, CustomerType } from '@feature/common';

export type Customer = {
  id: string;
  fullName: string;
  phoneNumber: string;
} & (
  | {
      type: Extract<CustomerType, 'consumer'>;
      addresses: ({ id: string } & Extract<CustomerAddress, { scope: 'inter_city' }>)[];
    }
  | {
      type: CustomerType;
      addresses: ({ id: string } & Extract<CustomerAddress, { scope: 'intra_city' }>)[];
    }
);
