import {
  SmsJobPayload,
  SmsJobs,
  SmsTemplateRegistry,
} from '@infra/messaging-queue/jobs/sms.job';
import { SMS_QUEUE_NAME } from '@infra/messaging-queue/queue-names';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class BullmqSms {
  constructor(@InjectQueue(SMS_QUEUE_NAME) private readonly queue: Queue) {}

  async send<T extends keyof SmsTemplateRegistry>(payload: SmsJobPayload<T>) {
    await this.queue.add(SmsJobs.Send, payload);
  }
}
