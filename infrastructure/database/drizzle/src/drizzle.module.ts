import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/bun-sql/postgres';
import { AsyncLocalStorage } from 'node:async_hooks';
import { DrizzleTransactionContext } from './drizzle-transaction.context';
import drizzleConfig from './drizzle.config';

@Global()
@Module({
  imports: [
    DrizzleModule.forRootAsync({
      imports: [ConfigModule.forFeature(drizzleConfig)],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        drizzle,
        connection: config.getOrThrow<string>('drizzle.databaseUrl'),
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
