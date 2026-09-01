import { LineItems } from '@feature/common';

export type Fulfillment =
  | {
      status: 'processing';
    }
  | {
      status: 'processed';
      items: LineItems<{ goodId: string; quantity: number }>;
      fulfilledAt: Date;
    }
  | {
      status: 'canceled_by_customer';
    }
  | {
      status: 'canceled_by_merchant';
      canceledAt: Date;
      reason: string;
    };
