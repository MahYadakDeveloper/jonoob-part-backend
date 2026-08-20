import { InvoiceItem, InvoiceSummary, LineItems } from '@feature/common';
import { Customer, CustomerAddress } from '@feature/customer-api';

export type BaseOrder = {
  orderId: string;
  customer: { id } & Customer;
  items: LineItems<InvoiceItem>;
  summary: InvoiceSummary;
  recipient:
    | ({
        carrier: 'courier';
      } & Extract<CustomerAddress, { scope: 'intra-city' }>)
    | ({
        carrier: {
          provider: string; // unique
        };
      } & Extract<CustomerAddress, { scope: 'inter-city' }>);
};

export type Order = BaseOrder &
  (
    | {
        status: 'in-delivery' | 'delivered';
        deliveryConfirmationCode: string;
      }
    | {
        status: 'preparing';
      }
  );
