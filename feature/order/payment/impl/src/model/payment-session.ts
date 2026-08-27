import { JobHandle } from '@feature/common';
import { Payment } from '@feature/order-payment-api';

export type PaymentSession = Payment & {
  createdAt: Date;
  expiryJob: JobHandle;
  orderId: string; // equivalent to :[orderId, reservationId] - prisma: @unique
};
