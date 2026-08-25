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

export type OrderStatus =
  | 'recorded'
  | 'settlement'
  | 'canceled'
  | 'canceled_by_admin'
  | 'process'
  | 'handed-over-to-courier'
  | 'courier-requested'
  | 'delivered';

export type Order = {
  orderId: string;
  customer: { id } & Customer;
  items: LineItems<InvoiceItem>;
  summary: InvoiceSummary;
  delivery: Delivery;
  payment?: PaymentResult;
  status: OrderStatus;
};

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
