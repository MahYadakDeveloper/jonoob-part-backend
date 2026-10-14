import { QueueModule } from '@infra/messaging-queue';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import path from 'node:path';
import { OtpSmsTemplate } from './sms/handlers/opt-template';
import { SMS_TEMPLATE_HANDLERS } from './sms/sms-template.handler';
import { SmsService } from './sms/sms.service';
import { SmsProcessor } from './processors/sms.processor';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        // path.join(process.cwd(), `.env.${process.env.NODE_ENV}`),
        path.join(process.cwd(), '../../.env'),
      ],
    }),
    QueueModule,
  ],
  providers: [
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
