import { StockGetHandler, WarehouseController } from '@feature/warehouse';
import {
  STOCK_MOVEMENT_API,
  STOCK_QUERY_API,
  STOCK_RESERVATION_API,
} from '@feature/warehouse-api';
import { LocalContextModule } from '@infra/local-context';
import { DrizzleOutboxModule } from '@infra/messaging-outbox';
import { Module } from '@nestjs/common';
import { StockReservationService } from './reservation/reserve.service';

@Module({
  imports: [DrizzleOutboxModule, LocalContextModule],
  providers: [
    StockGetHandler,
    StockReservationService,
    {
      provide: STOCK_MOVEMENT_API,
      useExisting: StockReservationService,
    },
  ],
  controllers: [WarehouseController],
  exports: [STOCK_MOVEMENT_API, STOCK_QUERY_API, STOCK_RESERVATION_API],
})
export class WarehouseModule {}
