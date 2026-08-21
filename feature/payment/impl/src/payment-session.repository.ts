import { PaymentSession } from './model/payment-session';

export interface PaymentSessionRepository {
  findByProviderId(providerId: number): Promise<PaymentSession | null>;
  delete(providerId: number): Promise<void>;
}
