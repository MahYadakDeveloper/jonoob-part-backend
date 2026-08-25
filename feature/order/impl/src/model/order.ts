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
  id: string;
  customer: { id: string } & Customer;
  items: LineItems<InvoiceItem>;
  cancellationTerms: {
    fee:
      | {
          type: 'fixed';
          amount: {
            value: number;
            unit: 'toman';
          };
        }
      | {
          type: 'rate';
          rate: number;
        };
  };
  summary: InvoiceSummary;
};

export type Order = BaseOrder &
  (
    | {
        status: 'recorded';

        recordedAt: Date;
        delivery: Delivery;
      }
    | ({
        paymentSessionId: number;
        recordedAt: Date;
      } & (
        | {
            status: 'settlement';
            delivery: Delivery;
          }
        | (
            | {
                status: 'canceled_by_admin';
                delivery: Delivery;
                refundedTo: 'wallet' | 'payment_reversed';
              }
            | {
                status: 'canceled';
                delivery: Delivery;
                canceledAt: Date;
                refundedTo?: 'wallet' | 'payment_reversed';
              }
            | (
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
              )
          )
      ))
  );
