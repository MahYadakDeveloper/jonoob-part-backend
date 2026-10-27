import { QueueModule } from '@infra/messaging-queue';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BullmqSms } from './bullmq-sms';
import { SMS_QUEUE_NAME } from './queue-name';

@Module({
  imports: [QueueModule, BullModule.registerQueue({ name: SMS_QUEUE_NAME })],
  providers: [BullmqSms],
  exports: [BullmqSms],
})
export class BullmqSmsModule {}
