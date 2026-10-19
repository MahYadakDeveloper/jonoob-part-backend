import { PaymentGatewayModule } from '@infra/payment-gateway';
import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { DeliveryAttemptReportPipe } from './delivery/delivery-attempt-report.pipe';
import { PaymentCallbackHandler } from './payment/payment-callback.handler';
import { PaymentController } from './payment/payment.controller';
import { PaymentAbilityFactory } from './payment/policy/payment-ability';
import { SettlementPolicyHandler } from './payment/policy/settlement.policy-handler';

@Module({
  imports: [
    PaymentGatewayModule.forRoot({
      callbackHandler: PaymentCallbackHandler,
    }),
  ],
  providers: [
    DeliveryAttemptReportPipe,
    PaymentAbilityFactory,
    SettlementPolicyHandler,
  ],
  controllers: [PaymentController],
})
export class OrderModule {
  static forRoot(options: ModuleMetadata): DynamicModule {
    return {
      module: OrderModule,
      ...options,
    };
  }
}
