import { WalletUsage } from '@feature/order-payment-api';

export interface PayRequest {
  providerId: number; // sessionId
  gateway: string;
  walletUsage?: WalletUsage;
}
