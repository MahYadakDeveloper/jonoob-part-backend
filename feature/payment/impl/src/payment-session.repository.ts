import { PaymentSession } from './model/payment-session';

export interface PaymentSessionRepository {
  findByProviderId(providerId: number): Promise<PaymentSession | null>;

  create(data: {
    orderId: string;
    status: PaymentSession['status'];
    expiresAt: Date;
  }): Promise<{ providerId: number }>;
  /**
   * [NOTE]
   * No Deletion for sessions because their life is related to orders
   */
  // delete(providerId: number): Promise<void>;
}
