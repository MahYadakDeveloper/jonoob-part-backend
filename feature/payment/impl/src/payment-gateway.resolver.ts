import { PaymentGateway } from '@feature/payment-gateway-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentGatewayResolver {
  private readonly gateways: Map<string, PaymentGateway>;

  constructor(gateways: PaymentGateway[]) {
    this.gateways = new Map(gateways.map((gateway) => [gateway.name, gateway]));
  }

  resolve(name: string): PaymentGateway {
    const gateway = this.gateways.get(name);

    if (!gateway) throw new Error(`Payment gateway not found: ${name}`);

    return gateway;
  }
}
