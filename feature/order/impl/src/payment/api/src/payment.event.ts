export const PaymentFailedEventType = 'payment:payment-failed';
export const PaymentSucceededEventType = 'payment:payment-succeeded';

export type PaymentFailedEventPayload = {
  orderId: string;
};

export type PaymentSucceededEventPayload = {
  orderId: string;
};
