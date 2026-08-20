import { PaymentGateway } from '@feature/payment-gateway-api';

export class DigipayGateway implements PaymentGateway {
  readonly name: string = 'digipay' as const;

  createPayment({
    orderId,
    providerId,
  }: {
    orderId: string;
    providerId: number;
  }): Promise<{ paymentUri: string }> {
    throw new Error('Method not implemented.');
  }
  verifyPayment({ providerId }: { providerId: string }): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
