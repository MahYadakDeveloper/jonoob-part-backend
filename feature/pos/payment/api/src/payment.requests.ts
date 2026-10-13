import { Money } from '@feature/shared';
import { UseWallet } from './payment.types';

export type PlanPaymentRequest =
  | {
      kind: 'registered';
      customerId: string;
      amountDue: Money;
      useWallet?: UseWallet;
    }
  | {
      kind: 'guest';
      amountDue: Money;
    };
