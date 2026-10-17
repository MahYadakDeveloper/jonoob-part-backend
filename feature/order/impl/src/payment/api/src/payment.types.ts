import { Money } from '@feature/shared';

export type WalletUsage = { mode: 'full' } | { mode: 'partial'; amount: Money };

export type Payment = {
  sessionId: number;
} & (
  | {
      status: 'initial';
    }
  | ({
      status: 'pending';
    } & (
      | {
          method: 'wallet';
          allocation: {
            amount: Money;
          };
        }
      | {
          method: 'gateway';
          allocation: {
            amount: Money;
          };
          gatewayKey: string;
          trackingCode: string;
        }
      | {
          method: 'partial';
          allocation: {
            walletAmount: Money;
            gatewayAmount: Money;
          };
          gatewayKey: string;
          trackingCode: string;
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
          method: 'gateway';
          allocation: {
            amount: Money;
          };
          gatewayKey: string;
          trackingCode: string;
        }
      | {
          method: 'partial';
          allocation: {
            walletAmount: Money;
            gatewayAmount: Money;
          };
          gatewayKey: string;
          trackingCode: string;
        }
    ))
  | {
      status: 'failure';
    }
  | {
      status: 'expired';
    }
  | ({
      status: 'refunded';
      refundedAt: Date;
      type: 'full';
    } & (
      | {
          destination: 'wallet';
        }
      | {
          destination: 'gateway';
          gatewayKey: string;
          trackingCode: string;
        }
      | {
          destination: 'partial';
          walletAmount: Money;
          gatewayAmount: Money;
          gatewayKey: string;
          trackingCode: string;
        }
    ))
  | {
      status: 'refunded';
      refundedAt: Date;
      type: 'partial';
      refundedAmount: Money;
      destination: 'wallet';
    }
);
