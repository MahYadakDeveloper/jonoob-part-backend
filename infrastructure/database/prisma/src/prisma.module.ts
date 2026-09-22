import { AsyncLocalTransactionContext } from '@infra/local-context';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import postgres from '@prisma/orm-postgres/runtime';
import contractJson, { Contract } from './../generated/prisma/contract';
import { PrismaDbProvider } from './prisma-db.provider';
import { PrismaTransactionManager } from './prisma-transaction-manager';
import prismaConfig from './prisma.config';

@Global()
@Module({
  imports: [ConfigModule],

  providers: [
    {
      provide: 'PrismaDbClient',
      inject: [prismaConfig.KEY],
      useFactory: (config: ConfigType<typeof prismaConfig>) =>
        postgres<Contract>({
          contractJson,
          url: config.databaseUrl,
        }),
    },
    AsyncLocalTransactionContext,
    PrismaDbProvider,
    PrismaTransactionManager,
    {
      provide: 'DbProvider',
      useExisting: PrismaDbProvider,
    },
    {
      provide: 'TransactionManager',
      useExisting: PrismaTransactionManager,
    },
  ],

  exports: ['TransactionManager', 'DbProvider'],
})
export class PrismaModule {}
