import { InvoiceItem, InvoiceSummary, LineItems } from '@feature/common';
import { UseWallet } from '@feature/payment-api';

export type CreatePaymentTicketRequest = {
  providerId: number; // paymentSession.id
  customerContact: {
    phone: string;
  };
  purchasedItems: LineItems<InvoiceItem>;
  summary: InvoiceSummary;
  useWallet?: UseWallet;
};

export type VerifyPaymentTicketRequest = { providerId: number };

export type GetPaymentTicketIdRequest = {
  providerId: number;
};
