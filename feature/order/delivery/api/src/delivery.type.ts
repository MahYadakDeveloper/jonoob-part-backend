import { CustomerAddress } from '@feature/customer-address-api';
import { Customer } from '@feature/customer-api';

export type InterCityRecipient = {
  carrierKey: string;
} & Extract<CustomerAddress, { scope: 'inter_city' }>;

export type IntraCityRecipient = Extract<
  CustomerAddress,
  { scope: 'intra_city' }
>;

export type Recipient = {
  customerContact: Pick<Customer, 'fullName' | 'phoneNumber' | 'type'>;
} & (IntraCityRecipient | InterCityRecipient);

export type Delivery = { id: string } & (
  | {
      status: 'initial';
      recipient: Recipient;
    }
  | {
      status: 'courier_requested';
      requestedAt: Date;
      recipient: Recipient;
    }
  | {
      status: 'canceled';
      canceledAt: Date;
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
            trackingNumber: string;
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
            reasonMessage: string;
          });
    }
);

export type IntraCityDeliveryFailureReasonType =
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
    };
