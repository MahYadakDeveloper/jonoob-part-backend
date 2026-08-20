import { InvoiceItem, InvoiceSummary, LineItems } from '@feature/common';
import { Customer, CustomerAddress } from '@feature/customer-api';

type IntraCityDelivery = {
  scope: 'intra-city';
  carrier: 'courier';
} & Omit<Extract<CustomerAddress, { scope: 'intra-city' }>, 'scope'>;

type InterCityDelivery = {
  scope: 'inter-city';
  carrier: {
    provider: string;
  };
} & Omit<Extract<CustomerAddress, { scope: 'inter-city' }>, 'scope'>;

export type Delivery = InterCityDelivery | IntraCityDelivery;

export type BaseOrder = {
  orderId: string;
  customer: { id: string } & Customer;
  items: LineItems<InvoiceItem>;
  summary: InvoiceSummary;
};

export type Order = BaseOrder &
  (
    | {
        status: 'settlement';
        delivery: Delivery;
      }
    | ({
        payment: Payment;
      } & (
        | {
            status: 'process' | 'cancelled';
            delivery: Delivery;
          }
        | {
            status: 'courier-requested' | 'cancelled';
            delivery: Delivery;
          }
        | (
            | {
                status: 'handed-over-to-courier';
                handedOver: Date;
                delivery:
                  | (IntraCityDelivery & {
                      deliveryConfirmationCode: string;
                    })
                  | InterCityDelivery;
              }
            | {
                status: 'delivered';
                deliveredAt: Date;
                delivery:
                  | (IntraCityDelivery & {
                      deliveryConfirmationCode: string;
                    })
                  | (InterCityDelivery & {
                      trackingNumber: string;
                    });
              }
          )
      ))
  );
