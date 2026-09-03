import { InvoiceItem, InvoiceSummary, LineItems } from '@feature/common';
import { Delivery } from '@feature/order-delivery-api';
import { Fulfillment } from '@feature/order-fulfillment-api';
import { Payment } from '@feature/order-payment-api';

export type BaseOrder = {
  id: string;
  customerId: string;
  recordedAt: Date;
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
        payment: Extract<Payment, { status: 'pending' | 'initiated' }>;
      }
    | ({
        payment: Extract<Payment, { status: 'paid' }>;
      } & (
        | {
            status: 'process';
            fulfillment: Extract<Fulfillment, { status: 'processing' }>;
          }
        | ({
            fulfillment: Extract<Fulfillment, { status: 'processed' }>;
          } & (
            | {
                status: 'in_delivery';
                delivery: Extract<
                  Delivery,
                  { status: 'courier_requested' | 'package_handed_over_to_courier' }
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
            delivery: Extract<Delivery, { status: 'initiated' }>;
          }
        | {
            status: 'canceled_by_merchant';
            fulfillment: Extract<Fulfillment, { status: 'canceled_by_merchant' }>;
            delivery: Extract<Delivery, { status: 'initiated' }>;
          }
        | {
            status: 'returned_to_warehouse';
            delivery: Extract<Delivery, { status: 'returned_to_warehouse' }>;
          }
      ))
    | {
        status: 'unsuccessful_pay';
        payment: Extract<Payment, { status: 'failure' | 'expired' | 'canceled' }>;
        delivery: Extract<Delivery, { status: 'initiated' }>;
      }
  );
