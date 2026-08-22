import { PaymentResult } from './order.type';

export const OrderRecordedEventType = 'order:order-recorded';
export const OrderPaidEventType = 'order:order-paid';
export const OrderPaymentFailedEventType = 'order:order-payment-failed';
export const OrderProcessedEventType = 'order:order-processed';
export const OrderCanceledEventType = 'order:order-canceled';
export const OrderHandedToCourierEventType = 'order:order-handed-to-courier';
export const OrderDeliveredEventType = 'order:order-delivered';

export type OrderEventPayload = {
  orderId: string;
  occurredAt: Date;
};

export type OrderPaidEventPayload = {
  payment: Extract<PaymentResult, { status: 'paid' }>;
};

export type OrderPaymentFailedEventPayload = {
  payment: Exclude<PaymentResult, { status: 'paid' }>;
};
