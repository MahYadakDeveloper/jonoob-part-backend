import { DrizzleDbModule } from '@infra/db-drizzle';
import { LocalContextModule } from '@infra/local-context';
import { Module } from '@nestjs/common';
import { StockRepositoryImpl } from './stock.repository';

@Module({
  imports: [DrizzleDbModule, LocalContextModule],
  providers: [
    {
      provide: 'StockRepository',
      useClass: StockRepositoryImpl,
    },
  ],
  exports: ['StockRepository'],
})
export class WarehousePersistentModule {}
