import { Payment } from './payment.types';

export type SettleResponse =
  | {
      payment: Extract<Extract<Payment, { status: 'pending' | 'paid' }>, { method: 'wallet' }>;
    }
  | {
      payment: Exclude<Extract<Payment, { status: 'pending' | 'paid' }>, { method: 'wallet' }>;
      paymentUrl: string;
    };

export type RefundResponse = { payment: Extract<Payment, { status: 'refunded' }> };
