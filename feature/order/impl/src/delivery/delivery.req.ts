import type { IntraCityDeliveryFailureReasonType } from './delivery';

export type ReportDeliveryAttemptRequest = {
  courierId: string;
  deliveryId: string;
} & (
  | ({
      result: 'delivered';
    } & (
      | {
          scope: 'inter_city';
          trackingNumber: string;
        }
      | {
          scope: 'intra_city';
          confirmationCode: string;
        }
    ))
  | ({
      deliveryId: string;
      result: 'failed';
    } & (
      | {
          scope: 'inter_city';
          reasonMessage: string;
        }
      | ({
          scope: 'intra_city';
        } & IntraCityDeliveryFailureReasonType)
    ))
);
