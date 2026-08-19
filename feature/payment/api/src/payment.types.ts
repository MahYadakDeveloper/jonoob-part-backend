import { Money } from '@feature/common';

export type UseWallet = { mode: 'full' } | { mode: 'partial'; amount: Money };

export type OrderPayment =
  | {
      status: 'pending';
    }
  | {
      status: 'paid';
    }
  | {
      status: 'cancelled';
    }
  | {
      status: 'expired';
    };
