import { Payment } from './payment.types';

export interface GetPaymentGatewayByOrderIdResponse {
  gateway: string;
}

export type PaymentSessionCreationResponse =
  | {
      payment: Extract<Extract<Payment, { status: 'pending' }>, { method: 'wallet' }>;
    }
  | {
      payment: Exclude<Extract<Payment, { status: 'pending' }>, { method: 'wallet' }>;
      paymentUrl: string;
    };

export type RefundResponse = { payment: Extract<Payment, { status: 'refunded' }> };
