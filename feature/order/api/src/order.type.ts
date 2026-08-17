import { Customer, CustomerAddress } from '@feature/customer-api';

export type Order = {
  orderId: string;
  customer: Customer;
  recipient:
    | ({
        carrier: 'courier';
      } & Extract<CustomerAddress, { scope: 'intra-city' }>)
    | ({
        carrier: {
          provider: string; // unique
        };
      } & Extract<CustomerAddress, { scope: 'inter-city' }>);
};
