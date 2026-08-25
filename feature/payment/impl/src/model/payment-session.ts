import { JobHandle } from '@feature/common';

export type PaymentSession = {
  providerId: number; // prisma: id Int @Id - session Id
  createdAt: Date;
  expiryJob: JobHandle;
  orderId: string; // equivalent to :[orderId, reservationId] - prisma: @unique
  refunded?:
    | {
        destination: 'wallet';
      }
    | {
        destination: 'gateway_provider';
        name: string;
      };
} & {
  gateway?:
    | {
        name: string;

        // [NOTE] The expired status means even if money paid they would refunded by gateway provider
        status: 'created' | 'expired' | 'failed' | 'canceled';
      }
    | {
        name: string;
        status: 'paid';
        /**
         * Reference Id/Number - Transaction Id/Number
         */
        transactionId: string;
      };
};
