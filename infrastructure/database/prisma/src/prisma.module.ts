import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import postgres from '@prisma/orm-postgres/runtime';
import contractJson, { Contract } from 'generated/prisma/contract';
import prismaConfig from './prisma.config';
import { PRISMA_DB } from './prisma.tokens';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PRISMA_DB,
      inject: [prismaConfig.KEY],
      useFactory: (config: ConfigType<typeof prismaConfig>) =>
        postgres<Contract>({
          contractJson,
          url: config.databaseUrl,
        }),
    },
  ],
  exports: [PRISMA_DB],
})
export class PrismaModule {}
