import { UseWallet } from '@feature/payment-api';

export interface PayRequest {
  providerId: number; // sessionId
  gatewayName: string;
  useWallet?: UseWallet;
}
