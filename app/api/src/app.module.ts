// import { BullModule } from '@nestjs/bullmq';
import { ActorsModule } from '@feature/actors';
import { AuthenticationModule } from '@feature/authentication';
import { AuthenticatedUser } from '@feature/shared/types/authenticated-user';
import { WarehouseModule } from '@feature/warehouse';
import { IdempotencyStoreModule } from '@infra/idempotency';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IdempotencyModule } from '@nestjs/idempotency';
import path from 'node:path';
// import { ScheduleModule } from '@nestjs/schedule';

const authenticationModule = AuthenticationModule.forRoot({
  imports: [ActorsModule],
});

@Module({
  imports: [
    IdempotencyStoreModule,
    IdempotencyModule.forRoot({
      // Runs after guards, so req.user is set. Keys never collide across users.
      scope: (req: { user: AuthenticatedUser }) =>
        req.user.role !== 'admin' ? req.user.id : undefined,
    }),
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
    authenticationModule,
    WarehouseModule.forRoot({ imports: [authenticationModule] }),
  ],
})
export class AppModule {}
