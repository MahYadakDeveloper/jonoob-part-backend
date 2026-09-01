export type Fulfillment = {
  id: string;
} & (
  | {
      status: 'processing';
    }
  | {
      status: 'processed';
      fulfilledAt: Date;
    }
  | {
      status: 'canceled';
      canceledAt: Date;
      reason: string;
    }
);
