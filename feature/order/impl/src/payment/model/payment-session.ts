import {
  Payment,
  PaymentSessionCreationRequest,
} from '@feature/order-payment-api';
import { JobHandle, Money } from '@feature/shared';
import { MerchandiseLine } from '@feature/shared/types/merchandise-line';

export type PaymentSession = {
  createdAt: Date;
} & Payment;
