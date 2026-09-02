import { CustomerAddress, CustomerContact } from '@feature/common';

export type IntraCityDelivery = Extract<CustomerAddress, { scope: 'intra-city' }>;

export type InterCityDelivery = {
  carrierKey: string;
} & Extract<CustomerAddress, { scope: 'inter-city' }>;

type InterCityRecipient = {
  customer: {
    id: string;
    contact: CustomerContact;
  };
} & InterCityDelivery;

type IntraCityRecipient = {
  customer: {
    id: string;
    contact: CustomerContact;
  };
} & IntraCityDelivery;

export type Delivery =
  | {
      scope: 'inter-city';
      status: 'initiated';
      initiatedAt: Date;
      recipient: InterCityRecipient;
    }
  | {
      scope: 'intra-city';
      status: 'initiated';
      initiatedAt: Date;
      recipient: IntraCityRecipient;
    }
  | {
      scope: 'inter-city';
      status: 'courier-requested';
      requestedAt: Date;
      recipient: InterCityRecipient;
    }
  | {
      scope: 'intra-city';
      status: 'courier-requested';
      requestedAt: Date;
      recipient: IntraCityRecipient;
    }
  | {
      scope: 'intra-city';
      status: 'handed-over-to-courier';
      handedOverAt: Date;
      deliveryConfirmationCode: string;
      recipient: IntraCityRecipient;
    }
  | {
      scope: 'inter-city';
      status: 'handed-over-to-courier';
      handedOverAt: Date;
      recipient: InterCityRecipient;
    }
  | {
      scope: 'inter-city';
      status: 'delivered';
      deliveredAt: Date;
      trackingNumber: number;
      recipient: InterCityRecipient;
    }
  | {
      scope: 'intra-city';
      status: 'delivered';
      deliveredAt: Date;
      deliveryConfirmationCode: string;
      recipient: IntraCityRecipient;
    };
