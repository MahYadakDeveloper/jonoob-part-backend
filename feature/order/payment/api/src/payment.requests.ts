import { LineItems, Money } from '@feature/common';
import { PaymentMethod, WalletUsage } from './payment.types';

type x = {
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

export type PaymentSessionCreationRequest<T extends PaymentMethod> = T extends 'wallet'
  ? {
      method: T;
      walletUsage: WalletUsage;
    } & x
  : T extends 'gateway'
    ? {
        method: T;
        gatewayKey: string;
      } & x
    : {
        method: T;
        gatewayKey: string;
        walletUsage: WalletUsage;
      } & x;

export interface GetPaymentGatewayByOrderIdRequest {
  orderId: string;
}

export interface RefundRequest {
  sessionId: number;
  customerId: string;
  amount: Money;
}
