import { STOCK_QUERY_API } from '@feature/warehouse-api';
import { DrizzleDbModule } from '@infra/db-drizzle';
import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [DrizzleDbModule],
  providers: [
    StockService,
    {
      provide: STOCK_QUERY_API,
      useExisting: StockService,
    },
  ],
  controllers: [StockController],
  exports: [STOCK_QUERY_API],
})
export class StockModule {}
