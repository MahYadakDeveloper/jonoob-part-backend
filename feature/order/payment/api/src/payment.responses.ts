import { Payment } from './payment.types';

export interface GetPaymentGatewayByOrderIdResponse {
  gateway: string;
}

export type PaymentSessionCreationResponse = {
  payment: Extract<Payment, { status: 'pending' }>;
  paymentUrl: string;
};

export type RefundResponse = { payment: Extract<Payment, { status: 'refunded' }> };
