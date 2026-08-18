export const PackageHandedOverToCourierEventType = 'courier:package-handed-over-to-courier';
export const PackageDeliveredEventType = 'courier:package-delivered';

export type PackageHandedOverToCourierEventPayload = {
  courierId: string;
  orderId: string;
  occurredAt: Date;
};

export type PackageDeliveredEventPayload =
  | {
      orderId: string;
      scope: 'inter-city';
      trackingNumber: string;
      occurredAt: Date;
    }
  | {
      orderId: string;
      scope: 'intra-city';
      occurredAt: Date;
    };
