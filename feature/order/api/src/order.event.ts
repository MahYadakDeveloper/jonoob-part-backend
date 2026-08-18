export const OrderPaidEventType = 'order:order-paid';
export const OrderEditingStartedEventType = 'order:order-editing-started';
export const OrderEditingDoneEventType = 'order:order-editing-done';
export const OrderCanceledEventType = 'order:order-recorded';
export const OrderProcessedEventType = 'order:order-processed';
export const OrderHandedToCourierEventType = 'order:order-handed-to-courier';
export const OrderDeliveredEventType = 'order:order-delivered';

export type OrderEventPayload = {
  orderId: string;
  occurredAt: Date;
};
