import { PaymentGatewayModule } from '@infra/payment-gateway';
import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { PaymentCallbackHandler } from './payment/payment-callback.handler';

@Module({
  imports: [
    PaymentGatewayModule.forRoot({
      callbackHandler: PaymentCallbackHandler,
    }),
  ],
  providers: [],
  controllers: [],
})
export class OrderModule {
  static forRoot(options: ModuleMetadata): DynamicModule {
    return {
      module: OrderModule,
      ...options,
    };
  }
}
