export type PaymentSession = {
  providerId: number; // prisma: id Int @Id - session Id
  createdAt: Date;
  expiresAt: Date;
  orderId: string; // equivalent to :[orderId, reservationId] - prisma: @unique
} & (
  | {
      status: 'created';
      gateway: string;
    }
  | {
      status: 'expired';
    }
  | {
      status: 'failed';
      gateway: string;
    }
  | {
      status: 'cancelled';
      gateway: string;
    }
  | {
      status: 'paid';
      gateway: string;
      /**
       * Reference Id/Number - Transaction Id/Number
       */
      transactionId: string;
    }
  | {
      status: 'reversed';
    }
);
