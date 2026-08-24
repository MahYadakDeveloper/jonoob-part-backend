export type DeliveryAttemptRequest =
  | ({
      orderId: string;
      result: 'delivered';
      deliveredAt: Date;
    } & (
      | {
          scope: 'inter-city';
          trackingNumber: string;
        }
      | {
          scope: 'intra-city';
        }
    ))
  | ({
      deliveryId: string;
      result: 'failed';
      attemptedAt: Date;
    } & (
      | ({
          scope: 'inter-city';
          reason: 'invalid-address';
        } & (
          | {
              reason: 'invalid-address';
            }
          | {
              reason: 'other';
              message: string;
            }
        ))
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
    ));
