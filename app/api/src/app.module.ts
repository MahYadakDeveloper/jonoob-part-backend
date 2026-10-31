// import { BullModule } from '@nestjs/bullmq';
import {
  AuthenticatedUser,
  AuthenticationHttpModule,
  createAuthThrottlerOption,
  JwtAuthService,
} from '@feature/authentication-http';
import { AuthGuard } from '@feature/authentication-http/guards';
import { ProblemDetailsFilter } from '@feature/error-http/filters';
import { ProblemTranslationInterceptor } from '@feature/error-http/interceptors';
import { getRedisToken, RedisModule } from '@infra/db-redis';
import { IdempotencyStoreModule } from '@infra/idempotency';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DrizzleModule } from '@nestjs/drizzle';
import { IdempotencyModule } from '@nestjs/idempotency';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { drizzle } from 'drizzle-orm/bun-sql/postgres';
import { Redis } from 'ioredis';
import path from 'node:path';
// import { ScheduleModule } from '@nestjs/schedule';

// const authenticationModule = AuthenticationModule.forRoot({
//   imports: [ActorsModule],
// });

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        // path.join(process.cwd(), `.env.${process.env.NODE_ENV}`),
        path.join(process.cwd(), '../../.env'),
      ],
    }),
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
      imports: [AuthenticationHttpModule],
      inject: [getRedisToken('throttler'), JwtAuthService],
      useFactory: (redis: Redis, jwt: JwtAuthService) => ({
        storage: new ThrottlerStorageRedisService(redis),
        throttlers: [
          { name: 'default', ttl: seconds(60), limit: 120 },
          createAuthThrottlerOption(jwt),
        ],
      }),
    }),

    IdempotencyStoreModule,
    IdempotencyModule.forRoot({
      isGlobal: true,
      // Runs after guards, so req.user is set. Keys never collide across users.
      scope: (req: { user: AuthenticatedUser }) =>
        req.user.role !== 'admin' ? req.user.id : undefined,
    }),

    DrizzleModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        drizzle,
        connection: config.getOrThrow<string>('DATABASE_URL'),
      }),
    }),

    // BullModule.forRoot({
    //   connection: {
    //     host: undefined,
    //     port: undefined,
    //   },
    // }),
    // ScheduleModule.forRoot(),
    // authenticationModule,
    // WarehouseModule.forRoot({}),
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_INTERCEPTOR, useClass: ProblemTranslationInterceptor },
  ],
})
export class AppModule {}
