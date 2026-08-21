import { UseWallet } from '@feature/payment-api';

export type CreatePaymentTicketRequest = {
  orderId: string;
  providerId: number; // paymentSession.id
  useWallet?: UseWallet;
};

export type VerifyPaymentTicketRequest = { providerId: number };
