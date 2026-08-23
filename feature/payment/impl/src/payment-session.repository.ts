import { PaymentSession } from './model/payment-session';

export interface PaymentSessionRepository {
  findByProviderId(providerId: number): Promise<PaymentSession | null>;
  /**
   * [NOTE]
   * No Deletion for sessions because their life is related to orders
   */
  // delete(providerId: number): Promise<void>;
}
