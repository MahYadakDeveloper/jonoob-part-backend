import { Customer, CustomerAddress } from '@feature/customer-api';

type BaseOrder = {
  orderId: string;
  customer: { id } & Customer;
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

export type Order = BaseOrder &
  (
    | {
        status: 'in-delivery';
        deliveryConfirmationCode: string;
      }
    | {
        status: 'preparing';
      }
  );
