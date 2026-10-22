import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { AsyncLocalStorage } from 'async_hooks';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DrizzleTransactionContext } from './drizzle-transaction.context';
import drizzleConfig from './drizzle.config';
import {
  actorsRelations,
  orderRelations,
  publicRelations,
  warehouseRelations,
} from './schema';

@Global()
@Module({
  imports: [
    DrizzleModule.forRootAsync({
      imports: [ConfigModule.forFeature(drizzleConfig)],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        drizzle,
        connection: config.getOrThrow<string>('drizzle.databaseUrl'),
        relations: {
          ...warehouseRelations,
          ...orderRelations,
          ...actorsRelations,
          ...publicRelations,
        },
      }),
    }),
  ],

  providers: [
    {
      provide: 'FOR_UPDATE_ALS',
      useValue: new AsyncLocalStorage(),
    },
    {
      provide: AsyncLocalStorage,
      useValue: new AsyncLocalStorage(),
    },
    DrizzleTransactionContext,
  ],
  exports: ['FOR_UPDATE_ALS', AsyncLocalStorage, DrizzleTransactionContext],
})
export class DrizzleDbModule {}
