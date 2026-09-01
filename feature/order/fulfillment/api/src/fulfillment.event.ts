export const OrderFulfillmentEnqueuedEventType = 'order-fulfillment-enqueued';
export type OrderFulfillmentEnqueuedEventPayload = {
  orderId: string;
};

export const OrderFulfillmentDoneEventType = 'order-fulfillment-done';
export type OrderFulfillmentDoneEventPayload = {
  orderId: string;
};

export const OrderFulfillmentCanceledEventType = 'order-fulfillment-canceled';
export type OrderFulfillmentCanceledEventPayload = {
  orderId: string;
};
