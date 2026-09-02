export interface PickingUpRequest {
  courierId: string;
  orderId: string;
}

export type ReportDeliveryAttemptRequest = {
  courierId: string;
  deliveryId: string;
} & (
  | ({
      result: 'delivered';
    } & (
      | {
          scope: 'inter-city';
          trackingNumber: string;
        }
      | {
          scope: 'intra-city';
          confirmationCode: string;
        }
    ))
  | ({
      deliveryId: string;
      result: 'failed';
    } & (
      | {
          scope: 'inter-city';
          message: string;
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
    ))
);
