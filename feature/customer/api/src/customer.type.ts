import { CustomerAddress, CustomerType } from '@feature/common';

export type Customer = {
  fullName: string;
  phoneNumber: string;
} & (
  | {
      type: Extract<CustomerType, 'consumer'>;
      addresses: ({ id: string } & Extract<CustomerAddress, { scope: 'inter_city' }>)[];
    }
  | {
      type: Exclude<CustomerType, 'technician'>;
      addresses: ({ id: string } & Extract<CustomerAddress, { scope: 'intra_city' }>)[];
    }
  | {
      type: Extract<CustomerType, 'technician'>;
      technician: 'mechanic' | 'electrician';
      addresses: ({ id: string } & Extract<CustomerAddress, { scope: 'intra_city' }>)[];
    }
);
