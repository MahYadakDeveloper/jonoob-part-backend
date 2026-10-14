import { PaymentGateway } from '@feature/order-payment-gateway-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentGatewayResolver {
  private readonly gateways: Map<string, PaymentGateway>;

  constructor(gateways: PaymentGateway[]) {
    this.gateways = new Map(gateways.map((gateway) => [gateway.key, gateway]));
  }

  resolve(key: string): PaymentGateway {
    const gateway = this.gateways.get(key);

    if (!gateway) throw new Error(`Payment gateway not found: ${key}`);

    return gateway;
  }
}
