import { Payment, PaymentMethod } from './payment.types';

export interface GetPaymentGatewayByOrderIdResponse {
  gateway: string;
}

export type PaymentSessionCreationResponse<T extends PaymentMethod> = T extends 'wallet'
  ? {
      payment: Extract<Exclude<Payment, { method: 'wallet' }>, { status: 'pending' }>;
      paymentUrl: string;
    }
  : {
      payment: Extract<Exclude<Payment, { method: 'wallet' }>, { status: 'pending' }>;
    };

export type RefundResponse = { payment: Extract<Payment, { status: 'refunded' }> };
