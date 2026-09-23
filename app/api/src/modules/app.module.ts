// import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import path from 'node:path';
import { WarehouseModule } from './warehouse/warehouse.module';
// import { ScheduleModule } from '@nestjs/schedule';

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
    WarehouseModule,
  ],
})
export class AppModule {}
