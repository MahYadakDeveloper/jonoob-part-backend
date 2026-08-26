import { InvoiceItem, InvoiceSummary, LineItems } from '@feature/common';
import { Delivery } from '@feature/order-delivery-api';

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
        status: 'recorded';
        recordedAt: Date;
        delivery: Extract<Delivery, { status: 'created' }>;
      }
    | {
        status: 'settlement';
        payment: Extract<Payment, { status: 'pending' }>;
        delivery: Extract<Delivery, { status: 'created' }>;
      }
    | {
        status: 'admin-canceled';
        canceledAt: Date;
        delivery: Exclude<Delivery, { status: 'delivered' | 'handed-over-to-courier' }>;
        payment: Extract<Payment, { status: 'refunded' }>;
      }
    | {
        status: 'canceled';
        delivery: Exclude<Delivery, { status: 'delivered' | 'handed-over-to-courier' }>;
        canceledAt: Date;
        payment: Extract<Payment, { status: 'refunded' }>;
      }
    | {
        status: 'processed';
        delivery: Delivery;
        payment: Extract<Payment, { status: 'paid' }>;
      }
  );
