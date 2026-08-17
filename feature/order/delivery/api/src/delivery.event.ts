export const CourierDispatchRequestedEventType = 'delivery:courier-dispatch-requested';

export type CourierDispatchRequestedEventPayload = {
  orderId: string;
  occurredAt: Date;
};
