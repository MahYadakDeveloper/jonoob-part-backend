export const OrderRecordedEventType = 'order:order-recorded';
export const OrderPaidEventType = 'order:order-paid';
export const OrderPaymentFailedEventType = 'order:order-payment-failed';
export const OrderFulfilledEventType = 'order:order-fulfilled';
export const OrderCanceledEventType = 'order:order-canceled';
export const OrderHandedToCourierEventType = 'order:order-handed-to-courier';
export const OrderDeliveredEventType = 'order:order-delivered';

export type OrderEventPayload = {
  orderId: string;
};

export type OrderPaidEventPayload = {
  orderId: string;
};

export type OrderPaymentFailedEventPayload = {
  orderId: string;
};
