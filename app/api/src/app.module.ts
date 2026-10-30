// import { BullModule } from '@nestjs/bullmq';
import {
  AuthenticatedUser,
  createAuthThrottlerOption,
} from '@feature/authentication-http/';
import { AuthGuard } from '@feature/authentication-http/guards';
import { ProblemDetailsFilter } from '@feature/errors-http/filters';
import { ProblemTranslationInterceptor } from '@feature/errors-http/interceptors';
import { JwtModule, JwtService } from '@infra/crypto-jwt';
import { getRedisToken, RedisModule } from '@infra/db-redis';
import { IdempotencyStoreModule } from '@infra/idempotency';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { IdempotencyModule } from '@nestjs/idempotency';
import { seconds, ThrottlerModule } from '@nestjs/throttler';
import { Redis } from 'ioredis';
import path from 'node:path';
// import { ScheduleModule } from '@nestjs/schedule';

// const authenticationModule = AuthenticationModule.forRoot({
//   imports: [ActorsModule],
// });

@Module({
  imports: [
    RedisModule.forRootAsync({
      names: ['default', 'throttler'],
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.getOrThrow<string>('REDIS_URL');
        return {
          default: { url },
          throttler: {
            url,
            commandTimeout: 100,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [JwtModule],
      inject: [getRedisToken('throttler'), JwtService],
      useFactory: (redis: Redis, jwt: JwtService) => ({
        storage: new ThrottlerStorageRedisService(redis),
        throttlers: [
          { name: 'default', ttl: seconds(60), limit: 120 },
          createAuthThrottlerOption(jwt),
        ],
      }),
    }),
    IdempotencyModule.forRoot({
      isGlobal: true,
      // Runs after guards, so req.user is set. Keys never collide across users.
      scope: (req: { user: AuthenticatedUser }) =>
        req.user.role !== 'admin' ? req.user.id : undefined,
    }),
    IdempotencyStoreModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        // path.join(process.cwd(), `.env.${process.env.NODE_ENV}`),
        path.join(process.cwd(), '../../.env'),
      ],
    }),
    // BullModule.forRoot({
    //   connection: {
    //     host: undefined,
    //     port: undefined,
    //   },
    // }),
    // ScheduleModule.forRoot(),
    // authenticationModule,
    WarehouseModule.forRoot({}),
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_INTERCEPTOR, useClass: ProblemTranslationInterceptor },
  ],
})
export class AppModule {}
