import { InvoiceItem, InvoiceSummary, LineItems } from '@feature/common';
import { Customer, CustomerAddress } from '@feature/customer-api';

export type Delivery =
  | ({
      carrier: 'courier';
    } & Extract<CustomerAddress, { scope: 'intra-city' }>)
  | ({
      carrier: {
        provider: string; // unique
      };
    } & Extract<CustomerAddress, { scope: 'inter-city' }>);

export type BaseOrder = {
  orderId: string;
  customer: { id } & Customer;
  items: LineItems<InvoiceItem>;
  summary: InvoiceSummary;
  delivery: Delivery;
};

export type Order = BaseOrder &
  (
    | {
        status: 'settlement';
      }
    | {
        status: 'canceled';
        payment: Exclude<PaymentResult, { status: 'paid' }>;
      }
    | ({
        payment: Extract<PaymentResult, { status: 'paid' }>;
      } & (
        | {
            status: 'process';
          }
        | {
            status: 'in-delivery' | 'delivered';
            deliveryConfirmationCode: string;
          }
      ))
  );

export type PaymentResult =
  | {
      status: 'paid';
      gateway: string;
      ticketId: string;
      providerId: number; // useful for confirming delivery for example: digipay
      settledAt: Date;
    }
  | {
      status: 'expired' | 'canceled' | 'reversed' | 'invalid';
      gateway?: string;
      ticketId: string;
      occurredAt: Date;
    };
