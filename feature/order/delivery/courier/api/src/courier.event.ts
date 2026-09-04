export const PackageHandedOverToCourierEventType = 'courier:package-handed-over';
export type PackageHandedOverToCourierEventPayload =
  | {
      deliveryId: string;
      courierId: string;
      scope: 'inter_city';
    }
  | {
      deliveryId: string;
      courierId: string;
      scope: 'intra_city';
      deliveryConfirmationCode: string;
    };

export const DeliverySucceededEventType = 'courier:delivery-succeeded';
export type DeliverySucceededEventPayload = {
  deliveryId: string;
} & (
  | {
      scope: 'inter_city';
      trackingNumber: string;
    }
  | {
      scope: 'intra_city';
    }
);

export const DeliveryFailedEventType = 'courier:delivery-failed';
export type DeliveryFailedEventPayload = {
  deliveryId: string;
} & (
  | {
      scope: 'inter_city';
      reasonMessage: string;
    }
  | ({
      scope: 'intra_city';
    } & (
      | {
          reason:
            | 'recipient_absent'
            | 'recipient_unreachable'
            | 'invalid_address'
            | 'recipient_refused';
        }
      | {
          reason: 'other';
          message: string;
        }
    ))
);
