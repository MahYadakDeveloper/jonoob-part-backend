import { InvoiceItem, InvoiceSummary, LineItems } from '@feature/common';
import { Delivery } from '@feature/order-delivery-api';
import { Fulfillment } from '@feature/order-fulfillment-api';
import { Payment } from '@feature/order-payment-api';

export type BaseOrder = {
  id: string;
  customerId: string;
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
        status: 'settlement';
        delivery: Extract<Delivery, { status: 'initial' }>;
        fulfillment: Extract<Delivery, { status: 'initial' }>;
        payment: Extract<Payment, { status: 'pending' | 'initiated' }>;
      }
    | ({
        payment: Extract<Payment, { status: 'paid' }>;
      } & (
        | {
            status: 'process';
            fulfillment: Extract<Fulfillment, { status: 'processing' }>;
            delivery: Extract<Delivery, { status: 'initial' }>;
          }
        | ({
            fulfillment: Extract<Fulfillment, { status: 'processed' }>;
          } & (
            | {
                status: 'in_delivery';
                delivery: Extract<
                  Delivery,
                  { status: 'courier_requested' | 'handed_over_to_courier' }
                >;
              }
            | {
                status: 'completed';
                delivery: Extract<Delivery, { status: 'delivered' }>;
              }
          ))
      ))
    | ({
        payment: Extract<Payment, { status: 'refunded' }>;
      } & (
        | {
            status: 'canceled_by_customer';
            fulfillment: Extract<Fulfillment, { status: 'canceled_by_customer' }>;
            delivery: Extract<Delivery, { status: 'initial' }>;
          }
        | {
            status: 'canceled_by_merchant';
            fulfillment: Extract<Fulfillment, { status: 'canceled_by_merchant' }>;
            delivery: Extract<Delivery, { status: 'initial' }>;
          }
        | {
            status: 'returned_to_warehouse';
            delivery: Extract<Delivery, { status: 'returned_to_warehouse' }>;
            fulfillment: Extract<Fulfillment, { status: 'fulfilled' }>;
          }
      ))
    | {
        status: 'unsuccessful_pay';
        payment: Extract<Payment, { status: 'failure' | 'expired' | 'canceled' }>;
        fulfillment: Extract<Fulfillment, { status: 'initial' }>;
        delivery: Extract<Delivery, { status: 'initial' }>;
      }
  );
