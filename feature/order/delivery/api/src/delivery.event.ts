export const CourierDispatchRequestedEventType = 'delivery:courier-dispatch-requested';
export const OrderDeliveredEventType = 'delivery:order-delivered';
export const OrderDelivery = 'delivery:order-delivery-failed';
export const OrderHandedOverToCourierEventType = 'delivery:order-handed-over-to-courier';

export type CourierDispatchRequestedEventPayload = {
  orderId: string;
};

export type OrderDeliveredEventPayload = { orderId: string };

export type OrderHandedOverToCourierEventPayload = { orderId: string };
