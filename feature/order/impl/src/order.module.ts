import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';

@Module({
  imports: [],
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
