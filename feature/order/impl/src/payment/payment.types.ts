export type PaymentMethod = 'wallet' | 'gateway' | 'partial';

export type PaymentAllocation<T extends PaymentMethod> = T extends 'wallet'
  ? {
      kind: 'wallet';
      amount: number;
    }
  : T extends 'gateway'
    ? {
        kind: 'gateway';
        amount: number;
      }
    : {
        kind: 'partial';
        walletAmount: number;
        gatewayAmount: number;
      };
