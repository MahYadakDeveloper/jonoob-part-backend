import { DeliveryAttemptRequest } from './delivery.req';

export const CourierDispatchRequestedEventType = 'delivery:courier-dispatch-requested';
export const PackageDeliveredEventType = 'delivery:package-delivered';
export const PackageDeliveryFailedEventType = 'delivery:package-delivery-failed';

export type CourierDispatchRequestedEventPayload = {
  orderId: string;
  requestedAt: Date;
};

export type PackageDeliveredEventPayload =
  | {
      orderId: string;
      scope: 'inter-city';
      trackingNumber: string;
      deliveredAt: Date;
    }
  | {
      orderId: string;
      scope: 'intra-city';
      deliveredAt: Date;
    };

export type PackageDeliveryFailedEventPayload = {
  attempt: DeliveryAttemptRequest;
};
