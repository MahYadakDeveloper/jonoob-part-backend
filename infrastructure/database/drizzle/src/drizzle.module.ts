import { LocalContextModule } from '@infra/local-context';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DrizzleDbProvider } from './drizzle-db.provider';
import { DrizzleTransactionManager } from './drizzle-transaction-manager';
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
    LocalContextModule,
  ],
  providers: [
    DrizzleDbProvider,
    DrizzleTransactionManager,
    {
      provide: 'DbProvider',
      useExisting: DrizzleDbProvider,
    },
    {
      provide: 'TransactionManager',
      useExisting: DrizzleTransactionManager,
    },
  ],

  exports: ['TransactionManager', 'DbProvider'],
})
export class DrizzleDbModule {}
