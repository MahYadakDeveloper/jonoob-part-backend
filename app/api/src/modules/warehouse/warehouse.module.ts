import { StockGetHandler, WarehouseController } from '@feature/warehouse';
import { LocalContextModule } from '@infra/local-context';
import { DrizzleOutboxModule } from '@infra/messaging-outbox';
import { WarehousePersistentModule } from '@infra/persistent-warehouse';
import { Module } from '@nestjs/common';

@Module({
  imports: [WarehousePersistentModule, DrizzleOutboxModule, LocalContextModule],
  providers: [StockGetHandler],
  controllers: [WarehouseController],
})
export class WarehouseModule {}
