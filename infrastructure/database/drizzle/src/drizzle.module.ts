import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { AsyncLocalStorage } from 'async_hooks';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DrizzleDbProvider } from './drizzle-db-provider';
import { DrizzleTransactionContext } from './drizzle-transaction.context';
import drizzleConfig from './drizzle.config';
import { warehouseRelations } from './schema';

@Global()
@Module({
  imports: [
    DrizzleModule.forRootAsync({
      imports: [ConfigModule.forFeature(drizzleConfig)],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        drizzle,
        connection: config.getOrThrow<string>('drizzle.databaseUrl'),
        relations: { ...warehouseRelations },
      }),
    }),
  ],

  providers: [
    {
      provide: AsyncLocalStorage,
      useValue: new AsyncLocalStorage(),
    },
    DrizzleDbProvider,
    DrizzleTransactionContext,
  ],
  exports: [DrizzleDbProvider, DrizzleTransactionContext],
})
export class DrizzleDbModule {}
