export type Fulfillment =
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
    };
