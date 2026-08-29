import { JobHandle } from '@feature/common';
import { Payment } from '@feature/order-payment-api';

export type PaymentSession = {
  createdAt: Date;
  orderId: string; // equivalent to :[orderId, reservationId] - prisma: @unique
} & (
  | (Exclude<Extract<Payment, { status: 'paid' | 'pending' }>, { method: 'wallet' }> & {
      expiryJob: JobHandle;
    })
  | Extract<Extract<Payment, { status: 'paid' | 'pending' }>, { method: 'wallet' }>
  | Exclude<Payment, { status: 'paid' | 'pending' }>
);
