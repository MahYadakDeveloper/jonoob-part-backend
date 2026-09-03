import { CustomerAddress, CustomerContact } from '@feature/common';

type InterCityRecipient = {
  carrierKey: string;
  customer: {
    id: string;
    contact: CustomerContact;
  };
} & Extract<CustomerAddress, { scope: 'inter_city' }>;

type IntraCityRecipient = {
  customer: {
    id: string;
    contact: CustomerContact;
  };
} & Extract<CustomerAddress, { scope: 'intra_city' }>;

export type Recipient = IntraCityRecipient | InterCityRecipient;

export type Delivery =
  | {
      status: 'created';
      requestedAt: Date;
      recipient: Recipient;
    }
  | {
      status: 'courier_requested';
      requestedAt: Date;
      recipient: Recipient;
    }
  | {
      status: 'handed_over_to_courier';
      courierId: string;
      handedOverAt: Date;
      recipient:
        | (IntraCityRecipient & {
            deliveryConfirmationCode: string;
          })
        | InterCityRecipient;
    }
  | {
      status: 'delivered';
      courierId: string;
      deliveredAt: Date;
      recipient:
        | (IntraCityRecipient & {
            deliveryConfirmationCode: string;
          })
        | (InterCityRecipient & {
            trackingNumber: number;
          });
    }
  | {
      status: 'returned_to_warehouse';
      courierId: string;
      returnedAt: Date;
      recipient:
        | (IntraCityRecipient & {
            deliveryConfirmationCode: string;
          } & (
              | {
                  reason:
                    | 'recipient_absent'
                    | 'recipient_unreachable'
                    | 'invalid_address'
                    | 'recipient_refused';
                }
              | {
                  reason: 'other';
                  message: string;
                }
            ))
        | (InterCityRecipient & {
            trackingNumber: number;
            reasonMessage: string;
          });
    };
