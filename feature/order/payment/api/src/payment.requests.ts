import { LineItems, Money } from '@feature/common';
import { WalletUsage } from './payment.types';

export interface PaymentSessionCreationRequest {
  orderId: string;
  gatewayKey: string;
  walletUsage?: WalletUsage;
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
}

export interface GetPaymentGatewayByOrderIdRequest {
  orderId: string;
}

export interface RefundRequest {
  sessionId: number;
  customerId: string;
  amount: Money;
}
