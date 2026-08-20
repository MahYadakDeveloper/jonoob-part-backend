import { Money } from '@feature/common';
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

export interface PaymentSessionCreationRequest {
  orderId: string;
  customerId: string;
}

export interface GetPaymentGatewayByOrderIdRequest {
  orderId: string;
}
