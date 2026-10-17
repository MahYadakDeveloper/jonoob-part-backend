import { SCHEDULED_QUEUE } from '@infra/messaging-job-scheduler/contracts';
import { QueueModule } from '@infra/messaging-queue';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import path from 'node:path';
import { ScheduledJobsProcessor } from './processors/scheduled-jobs.processor';
import { SmsProcessor } from './processors/sms.processor';
import { OtpSmsTemplate } from './sms/handlers/opt-template';
import { SMS_TEMPLATE_HANDLERS } from './sms/sms-template.handler';
import { SmsService } from './sms/sms.service';

@Module({
  imports: [
    DiscoveryModule,
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        // path.join(process.cwd(), `.env.${process.env.NODE_ENV}`),
        path.join(process.cwd(), '../../.env'),
      ],
    }),
    QueueModule,
    BullModule.registerQueue({ name: SCHEDULED_QUEUE }),
  ],
  providers: [
    ScheduledJobsProcessor,
    SmsProcessor,
    SmsService,
    OtpSmsTemplate,
    {
      provide: SMS_TEMPLATE_HANDLERS,
      useFactory: (otpTemplate: OtpSmsTemplate) => [otpTemplate],
      inject: [OtpSmsTemplate],
    },
  ],
})
export class WorkerModule {}
