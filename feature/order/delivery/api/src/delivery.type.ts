import { Customer, CustomerAddress } from '@feature/common';

export type IntraCityDelivery = Extract<CustomerAddress, { scope: 'intra-city' }>;

export type InterCityDelivery = {
  carrierId: string;
} & Extract<CustomerAddress, { scope: 'inter-city' }>;

export type Delivery = {
  recipient: {
    customerContact: Customer;
  } & (InterCityDelivery | IntraCityDelivery);
} & (
  | {
      status: 'courier-requested';
      requestedAt: Date;
    }
  | ({
      status: 'handed-over-to-courier';
      handedOverAt: Date;
    } & (
      | {
          scope: 'intra-city';
          deliveryConfirmationCode: string;
        }
      | {
          scope: 'inter-city';
        }
    ))
  | ({
      status: 'delivered';
      deliveredAt: Date;
    } & (
      | {
          scope: 'intra-city';
          deliveryConfirmationCode: string;
        }
      | {
          scope: 'inter-city';
          trackingNumber: number;
        }
    ))
);
