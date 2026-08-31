import { LineItems, Money } from '@feature/common';
import { PaymentMethod, WalletUsage } from './payment.types';

export type PaymentSessionCreationRequest = {
  orderId: string;
  customer: {
    id: string;
    contact: {
      phoneNumber: string;
    };
  };

  purchasedItems: LineItems<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: Money;
  }>;
  amount: Money;
};

export type SettleRequest<T extends PaymentMethod> = {
  sessionId: number;
  customerId: string;
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

export interface RefundRequest {
  sessionId: number;
  customerId: string;
}
