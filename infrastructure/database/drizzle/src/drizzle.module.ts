import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/bun-sql/postgres';
import { DrizzleTransactionAls } from './drizzle-transaction.als';
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
  providers: [DrizzleTransactionAls], // default scope = singleton
  exports: [DrizzleTransactionAls],
})
export class DrizzleDbModule {}
