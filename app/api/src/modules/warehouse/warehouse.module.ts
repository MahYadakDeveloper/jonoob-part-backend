import { WarehouseController } from '@feature/warehouse';
import { DrizzleOutboxModule } from '@infra/messaging-outbox';
import { WarehousePersistentModule } from '@infra/persistent-warehouse';
import { Module } from '@nestjs/common';

@Module({
  imports: [WarehousePersistentModule, DrizzleOutboxModule],
  // providers: [WarehouseService],
  controllers: [WarehouseController],
})
export class WarehouseModule {}
