import { LineItems } from '@feature/common';

export type Fulfillment = {
  items: LineItems<{ stockId: string; qty: number }>;
} & (
  | {
      status: 'initial';
    }
  | {
      status: 'processing';
    }
  | {
      status: 'fulfilled';
      fulfilledAt: Date;
    }
  | {
      status: 'canceled_by_customer';
    }
  | {
      status: 'canceled_by_merchant';
      canceledAt: Date;
      reason: string;
    }
);
