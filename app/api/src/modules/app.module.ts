// import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WarehouseModule } from './warehouse/warehouse.module';
// import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({}),
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
