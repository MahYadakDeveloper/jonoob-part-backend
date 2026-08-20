import { Payment } from '@feature/common';

export interface PlanPaymentResponse {
  payment: Payment;
}

export interface PayResponse {
  payment_uri: string;
}

export interface GetPaymentGatewayByOrderIdResponse {
  gateway: string;
}
