import { Money } from '@feature/common';

export type WalletUsage = { mode: 'full' } | { mode: 'partial'; amount: Money };

export type Payment = {
  sessionId: number;
  gatewayKey: string;
} & (
  | {
      status: 'pending';
    }
  | {
      status: 'paid';
      paidAt: Date;
      allocation: PaymentAllocation;
    }
  | {
      status: 'failure';
    }
  | {
      status: 'refunded';
      refundedAt: Date;
      destination: 'wallet' | 'gateway';
    }
);

export type PaymentAllocation =
  | {
      kind: 'wallet';
      amount: Money;
    }
  | {
      kind: 'gateway';
      gateway: string;
      amount: Money;
      transactionId: string;
    }
  | {
      kind: 'mixed';
      walletAmount: Money;
      gateway: string;
      gatewayAmount: Money;
      transactionId: string;
    };
