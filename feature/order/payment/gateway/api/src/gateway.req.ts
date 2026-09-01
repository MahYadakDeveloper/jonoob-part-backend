import { LineItems, Money } from '@feature/common';

export type CreatePaymentTicketRequest = {
  providerId: number; // payment session id
  customerContact: {
    phoneNumber: string;
  };
  purchasedItems: LineItems<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: Money;
  }>;

  amount: Money;
};

export type VerifyPaymentTicketRequest = { providerId: number; ticketId: string };

export type GetPaymentTicketIdRequest = {
  providerId: number;
};
export interface GetTicketStatusRequest {
  ticketId: string;
}
