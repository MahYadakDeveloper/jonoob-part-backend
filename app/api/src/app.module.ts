import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({}),
    BullModule.forRoot({
      connection: {
        host: undefined,
        port: undefined,
      },
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
