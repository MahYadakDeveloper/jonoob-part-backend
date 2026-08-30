import { Money } from '@feature/common';

export type WalletUsage = { mode: 'full' } | { mode: 'partial'; amount: Money };

export type Payment = {
  sessionId: number;
} & (
  | {
      status: 'initiated';
    }
  | ({
      status: 'pending';
    } & (
      | {
          method: 'wallet';
          allocation: PaymentAllocation<'wallet'>;
        }
      | {
          method: 'gateway' | 'partial';
          allocation: PaymentAllocation<'gateway' | 'partial'>;
          gatewayKey: string;
        }
    ))
  | ({
      status: 'paid';
      paidAt: Date;
    } & (
      | {
          method: 'wallet';
          allocation: PaymentAllocation<'wallet'>;
        }
      | {
          method: 'gateway' | 'partial';
          allocation: PaymentAllocation<'gateway' | 'partial'>;
          gatewayKey: string;
        }
    ))
  | {
      status: 'failure';
    }
  | ({
      status: 'refunded';
      refundedAt: Date;
    } & (
      | {
          destination: 'wallet';
        }
      | {
          destination: 'gateway';
          gatewayKey: string;
          trackingCode: string;
        }
    ))
);

export type PaymentMethod = 'wallet' | 'gateway' | 'partial';

export type PaymentAllocation<T extends PaymentMethod> = T extends 'wallet'
  ? {
      kind: 'wallet';
      amount: Money;
    }
  : T extends 'gateway'
    ? {
        kind: 'gateway';
        amount: Money;
      }
    : {
        kind: 'partial';
        walletAmount: Money;
        gatewayAmount: Money;
      };
