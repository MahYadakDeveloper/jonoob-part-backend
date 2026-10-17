import { Injectable } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentCallbackHandler as PCH } from '@infra/payment-gateway';

@Injectable()
export class PaymentCallbackHandler implements PCH {
  constructor(private readonly payments: PaymentService) {}

  async handle(providerId: number) {
    return { status: await this.payments.verify(providerId) };
  }
}
