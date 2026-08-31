export const PaymentFailedEventType = 'payment:payment-failed';
export const PaymentSucceededEventType = 'payment:payment-succeeded';

export type PaymentFailedEventPayload = {
  sessionId: number;
};

export type PaymentSucceededEventPayload = {
  sessionId: number;
};
