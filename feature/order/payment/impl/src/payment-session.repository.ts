import { JobHandle } from '@feature/common';
import { Payment } from '@feature/order-payment-api';
import { PaymentSession } from './model/payment-session';

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export interface PaymentSessionRepository {
  findById(sessionId: number): Promise<PaymentSession | null>;
  findByOrderId(orderId: string): Promise<PaymentSession | null>;

  create(
    data: DistributiveOmit<
      Extract<PaymentSession, { status: 'initial' }>,
      'sessionId' | 'createdAt'
    >,
  ): Promise<void>;

  updatePaymentStatusTo<T extends Payment['status']>(
    data: Extract<Payment, { status: T }> &
      (T extends 'pending' ? { expiryJob: JobHandle } : unknown),
  ): Promise<Payment>;
  /**
   * [NOTE]
   * No Deletion for sessions because their life is related to orders
   */
  // delete(providerId: number): Promise<void>;
}
