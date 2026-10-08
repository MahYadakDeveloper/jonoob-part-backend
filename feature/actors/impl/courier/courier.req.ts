export interface PickingUpRequest {
  courierId: string;
  deliveryId: string;
}

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
    ))
);
