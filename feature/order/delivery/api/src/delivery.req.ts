export type DeliveryAttemptRequest =
  | {
      deliveryId: string;
      result: 'delivered';
      deliveredAt: Date;
    }
  | {
      deliveryId: string;
      result: 'failed';
      reason:
        | 'recipient-absent'
        | 'recipient-unreachable'
        | 'invalid-address'
        | 'recipient-refused'
        | 'other';
      attemptedAt: Date;
    };
