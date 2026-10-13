// import { BullModule } from '@nestjs/bullmq';
import { ActorsModule } from '@feature/actors';
import { AuthenticationModule } from '@feature/authentication';
import { WarehouseModule } from '@feature/warehouse';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import path from 'node:path';
// import { ScheduleModule } from '@nestjs/schedule';

const authenticationModule = AuthenticationModule.forRoot({
  imports: [ActorsModule],
});

@Module({
  imports: [
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
