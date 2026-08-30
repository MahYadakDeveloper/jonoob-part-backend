import { JobHandle, Money } from '@feature/common';
import { Payment, PaymentSessionCreationRequest } from '@feature/order-payment-api';

export type PaymentSession = {
  createdAt: Date;
  orderId: string; // equivalent to :[orderId, reservationId] - prisma: @unique
  customerContact: PaymentSessionCreationRequest['customerContact'];
  purchasedItems: PaymentSessionCreationRequest['purchasedItems'];
  expiryJob: JobHandle;
  amount: Money;
} & Payment;
