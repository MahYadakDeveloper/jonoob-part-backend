import { COURIER_API } from '@feature/actors-api/courier';
import { CUSTOMERS_API } from '@feature/actors-api/customer';
import { MANAGER_API } from '@feature/actors-api/manager';
import { DrizzleDbModule } from '@infra/db-drizzle';
import { QueueModule } from '@infra/messaging-queue';
import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { CourierApiImpl } from './courier/courier.api';
import { CourierRepository } from './courier/courier.repository';
import { CustomersApiImpl } from './customer/customer.api';
import { CustomerRepository } from './customer/customer.repository';
import { ManagerRepository } from './manager/manager.repository';
import { ManagerService } from './manager/manager.service';

@Module({
  imports: [DrizzleDbModule, QueueModule],
  providers: [
    {
      provide: AsyncLocalStorage,
      useValue: new AsyncLocalStorage(),
    },
    CourierRepository,
    CustomerRepository,
    ManagerRepository,
    {
      provide: COURIER_API,
      useClass: CourierApiImpl,
    },
    {
      provide: MANAGER_API,
      useClass: ManagerService,
    },
    {
      provide: CUSTOMERS_API,
      useClass: CustomersApiImpl,
    },
  ],
  exports: [COURIER_API, MANAGER_API, CUSTOMERS_API],
})
export class ActorsModule {
  static forRoot(options: ModuleMetadata): DynamicModule {
    return {
      module: ActorsModule,
      ...options,
    };
  }
}
