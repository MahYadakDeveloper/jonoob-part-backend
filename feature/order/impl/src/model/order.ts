import { InvoiceItem, InvoiceSummary, LineItems } from '@feature/common';
import { Customer, CustomerAddress } from '@feature/customer-api';
import { PaymentResult } from '@feature/order-api';

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
  recordedAt: Date;
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
    | {
        status: 'canceled';
        delivery: Delivery;
        payment: Exclude<PaymentResult, { status: 'paid' }>;
        canceledAt: Date;
      }
    | ({
        payment: Extract<PaymentResult, { status: 'paid' }>;
        settledAt: Date;
      } & (
        | {
            status: 'process' | 'courier-requested';
            delivery: Delivery;
            processedAt: Date;
          }
        | (
            | {
                status: 'handed-over-to-courier';
                handedOverAt: Date;
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
