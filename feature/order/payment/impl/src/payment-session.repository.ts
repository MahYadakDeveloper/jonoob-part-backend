import { Payment } from '@feature/order-payment-api';
import { PaymentSession } from './model/payment-session';

export interface PaymentSessionRepository {
  findById(sessionId: number): Promise<PaymentSession | null>;
  findByOrderId(orderId: string): Promise<PaymentSession | null>;

  create(
    data: Omit<Extract<PaymentSession, { status: 'pending' }>, 'sessionId' | 'createdAt'>,
  ): Promise<Extract<PaymentSession, { status: 'pending' }>>;

  updatePaymentStatusTo<T extends Payment['status']>(
    data: Extract<Payment, { status: T }>,
  ): Promise<void>;
  /**
   * [NOTE]
   * No Deletion for sessions because their life is related to orders
   */
  // delete(providerId: number): Promise<void>;
}
