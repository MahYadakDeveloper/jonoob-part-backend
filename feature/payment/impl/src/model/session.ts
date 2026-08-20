export type PaymentSession = {
  id: number; // prisma: id Int @Id
  createdAt: Date;
  // expires: x
  reservationId: string; // orderId - prisma: @unique
} & (
  | {
      status: 'pending';
      token?: string;
    }
  | {
      status: 'failed';
    }
  | {
      status: 'cancelled';
    }
  | {
      status: 'paid';

      /**
       * Reference Id/Number - Transaction Id/Number
       */
      transactionId: string;
    }
);
