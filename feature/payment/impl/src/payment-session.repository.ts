import { JobHandle } from '@feature/common';
import { PaymentSession } from './model/payment-session';

export interface PaymentSessionRepository {
  findByProviderId(providerId: number): Promise<PaymentSession | null>;
  findByOrderId(orderId: string): Promise<PaymentSession | null>;

  create(data: { orderId: string; expiryJob: JobHandle }): Promise<{ providerId: number }>;

  updateGatewayStatus(gateway: PaymentSession['gateway']): Promise<void>;
  /**
   * [NOTE]
   * No Deletion for sessions because their life is related to orders
   */
  // delete(providerId: number): Promise<void>;
}
