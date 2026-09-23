import { WarehouseController } from '@feature/warehouse';
import { WarehousePersistentModule } from '@infra/persistent-warehouse';
import { Module } from '@nestjs/common';

@Module({
  imports: [WarehousePersistentModule],
  // providers: [WarehouseService],
  controllers: [WarehouseController],
})
export class WarehouseModule {}
