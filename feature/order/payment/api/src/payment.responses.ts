import { Payment } from '@feature/common';

export interface PlanPaymentResponse {
  payment: Payment;
}

export interface GetPaymentGatewayByOrderIdResponse {
  gateway: string;
}
