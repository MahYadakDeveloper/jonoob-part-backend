// import { BullModule } from '@nestjs/bullmq';
import { IdempotencyStoreModule } from '@infra/idempotency';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IdempotencyModule } from '@nestjs/idempotency';
import path from 'node:path';
import { AuthenticatedUser } from '@feature/authentication-http/';
import { AuthGuard } from '@feature/authentication-http/guards';
import { APP_GUARD } from '@nestjs/core';
// import { ScheduleModule } from '@nestjs/schedule';

// const authenticationModule = AuthenticationModule.forRoot({
//   imports: [ActorsModule],
// });

@Module({
  imports: [
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
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
