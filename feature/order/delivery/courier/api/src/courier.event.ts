export const PackageHandedOverToCourierEventType = 'courier:package-handed-over';
export type PackageHandedOverToCourierEventPayload =
  | {
      deliveryId: string;
      courierId: string;
      scope: 'inter-city';
    }
  | {
      deliveryId: string;
      courierId: string;
      scope: 'intra-city';
      deliveryConfirmationCode: string;
    };

export const DeliverySucceededEventType = 'courier:delivery-succeeded';
export type DeliverySucceededEventPayload = {
  deliveryId: string;
} & (
  | {
      scope: 'inter-city';
      trackingNumber: string;
    }
  | {
      scope: 'intra-city';
    }
);

export const DeliveryFailedEventType = 'courier:delivery-failed';
export type DeliveryFailedEventPayload = {
  deliveryId: string;
} & (
  | {
      scope: 'inter-city';
      reasonMessage: string;
    }
  | ({
      scope: 'intra-city';
    } & (
      | {
          reason:
            | 'recipient-absent'
            | 'recipient-unreachable'
            | 'invalid-address'
            | 'recipient-refused';
        }
      | {
          reason: 'other';
          message: string;
        }
    ))
);
