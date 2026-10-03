import {
  STOCK_MOVEMENT_API,
  STOCK_QUERY_API,
  STOCK_RESERVATION_API,
} from '@feature/warehouse-api';
import { Module } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Module({
  imports: [],
  providers: [
    { provide: AsyncLocalStorage, useValue: new AsyncLocalStorage() },
  ],
  exports: [STOCK_MOVEMENT_API, STOCK_QUERY_API, STOCK_RESERVATION_API],
})
export class WarehouseModule {}
