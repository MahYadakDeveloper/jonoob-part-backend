import { DrizzleDbModule } from '@infra/db-drizzle';
import { LocalContextModule } from '@infra/local-context';
import { Module } from '@nestjs/common';
import { DrizzleStockRepository } from './stock/drizzle-stock.repository';

@Module({
  imports: [DrizzleDbModule, LocalContextModule],
  providers: [
    {
      provide: 'StockRepository',
      useClass: DrizzleStockRepository,
    },
  ],
  exports: ['StockRepository'],
})
export class WarehousePersistentModule {}
