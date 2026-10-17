import { Inject } from '@nestjs/common';
import { type TicketStatus } from './contracts';

/**
 * Port implemented by the feature that owns payments. Gateway callbacks
 * (HTTP redirects) delegate to it so infrastructure never depends on features.
 */
export interface PaymentCallbackHandler {
  handle(paymentId: number): Promise<{ status: TicketStatus }>;
}

export const PAYMENT_CALLBACK_HANDLER = Symbol('PAYMENT_CALLBACK_HANDLER');

export const InjectPaymentCallbackHandler = () =>
  Inject(PAYMENT_CALLBACK_HANDLER);
