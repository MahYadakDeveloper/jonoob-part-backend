export const OrderPaidEventType = 'order:order-paid';
export const OrderPaymentFailedEventType = 'order:order-payment-failed';
export const OrderProcessedEventType = 'order:order-processed';
export const OrderHandedToCourierEventType = 'order:order-handed-to-courier';
export const OrderDeliveredEventType = 'order:order-delivered';

export type OrderEventPayload = {
  orderId: string;
  occurredAt: Date;
};

export type OrderPaidEventPayload = {
  payment: {
    gateway: string;
    ticketId: string;
    providerId: number; // useful for confirming delivery for example: digipay
    settledAt: Date;
  };
};

export type OrderPaymentFailedEventPayload = {
  gateway?: string;
  ticketId: string;
  reason: 'expired' | 'canceled' | 'reversed' | 'invalid';
  occurredAt: Date;
};
