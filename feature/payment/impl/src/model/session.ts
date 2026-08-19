export type PaymentSession = {
  id: string;
  createdAt: Date;
  // expires: x
} & (
  | {
      status: 'pending';
      gateway: ???;
    }
  | {
      status: 'failed';
    }
  | {
      status: 'cancelled';
    }
  | {
      status: 'paid';
    }
);
