import { LineItems, Money } from '@feature/common';
import { PaymentMethod, WalletUsage } from './payment.types';

type PaymentSessionCreationRequestParams = {
  orderId: string;
  customerId: string;
  customerContact: {
    phoneNumber: string;
  };
  purchasedItems: LineItems<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: Money;
  }>;
  amount: Money;
};

export type PaymentSessionCreationRequest<T extends PaymentMethod> = {
  orderId: string;
  customerId: string;
  customerContact: {
    phoneNumber: string;
  };
  purchasedItems: LineItems<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: Money;
  }>;
  amount: Money;
} & (T extends 'wallet'
  ? {
      method: T;
      walletUsage: WalletUsage;
    }
  : T extends 'gateway'
    ? {
        method: T;
        gatewayKey: string;
      }
    : {
        method: T;
        gatewayKey: string;
        walletUsage: WalletUsage;
      });

export interface GetPaymentGatewayByOrderIdRequest {
  orderId: string;
}

export interface RefundRequest {
  sessionId: number;
  customerId: string;
  amount: Money;
}
