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

export type ExternalPaymentMethod = 'posTerminal' | 'onlinePaymentGateway';

export type PaymentMethod =
  | {
      kind: 'wallet';
      walletAmount: Money;
    }
  | {
      kind: 'external';
      external: {
        method: ExternalPaymentMethod;
        amount: Money;
      };
    }
  | {
      kind: 'mixed';
      walletAmount: Money;
      external: {
        method: ExternalPaymentMethod;
        amount: Money;
      };
    };
