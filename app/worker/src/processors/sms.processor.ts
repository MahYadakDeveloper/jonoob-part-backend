import { SMS_QUEUE_NAME } from '@infra/messaging-queue/constants';
import { SmsJobPayload } from '@infra/messaging-queue/job-types';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { SmsService } from '../sms/sms.service';
import {
  SMS_TEMPLATE_HANDLERS,
  SmsTemplateHandler,
} from '../sms/sms-template.handler';

@Processor(SMS_QUEUE_NAME, { concurrency: 5 })
export class SmsProcessor extends WorkerHost {
  private readonly handlers: Map<string, SmsTemplateHandler>;

  constructor(
    private readonly sender: SmsService,
    @Inject(SMS_TEMPLATE_HANDLERS) handlers: SmsTemplateHandler[],
  ) {
    super();
    this.handlers = new Map(handlers.map((h) => [h.template, h]));
  }

  async process(job: Job<SmsJobPayload>): Promise<void> {
    const { to, template, data } = job.data;

    const handler = this.handlers.get(template);
    if (!handler) {
      throw new Error(`No SMS template handler for "${String(template)}"`);
    }

    await this.sender.send(to, handler.render(data as never));
  }
}
