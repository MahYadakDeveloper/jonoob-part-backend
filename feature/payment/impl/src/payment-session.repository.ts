import { PaymentSession } from './model/payment-session';

export interface PaymentSessionRepository {
  findByProviderId(providerId: string): Promise<PaymentSession | null>;
}
