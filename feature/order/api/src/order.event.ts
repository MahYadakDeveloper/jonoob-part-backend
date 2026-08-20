export const OrderPaidEventType = 'order:order-paid';
export const OrderCanceledEventType = 'order:order-recorded';
export const OrderProcessedEventType = 'order:order-processed';
export const OrderHandedToCourierEventType = 'order:order-handed-to-courier';
export const OrderDeliveredEventType = 'order:order-delivered';

export type OrderEventPayload = {
  orderId: string;
  occurredAt: Date;
};
