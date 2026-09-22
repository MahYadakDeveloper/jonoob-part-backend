import { AsyncLocalTransactionContext } from '@infra/local-context';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DrizzleDbProvider } from './drizzle-db.provider';
import { DrizzleTransactionManager } from './drizzle-transaction-manager';
import drizzleConfig from './drizzle.config';

@Global()
@Module({
  imports: [ConfigModule],

  providers: [
    {
      provide: 'DrizzleDbClient',
      inject: [drizzleConfig.KEY],
      useFactory: (config: ConfigType<typeof drizzleConfig>) => {
        const pool = new Pool({
          connectionString: config.databaseUrl,
        });

        return drizzle({
          client: pool,
        });
      },
    },
    AsyncLocalTransactionContext,
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
export class DrizzleModule {}
