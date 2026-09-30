import {
  STOCK_MOVEMENT_API,
  STOCK_QUERY_API,
  STOCK_RESERVATION_API,
} from '@feature/warehouse-api';
import { StockModule } from '@feature/warehouse-stock';
import { Module } from '@nestjs/common';

@Module({
  imports: [StockModule],
  exports: [STOCK_MOVEMENT_API, STOCK_QUERY_API, STOCK_RESERVATION_API],
})
export class WarehouseModule {}
