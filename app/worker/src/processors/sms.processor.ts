import { SMS_QUEUE_NAME } from '@infra/messaging-queue/constants';
import { SmsJobPayload, SmsTemplate } from '@infra/messaging-queue/job-types';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  SMS_TEMPLATE_HANDLERS,
  SmsTemplateHandler,
} from '../sms/sms-template.handler';
import { SmsService } from '../sms/sms.service';

@Processor(SMS_QUEUE_NAME, { concurrency: 5 })
export class SmsProcessor extends WorkerHost {
  private readonly handlers: Map<SmsTemplate, SmsTemplateHandler>;

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

    const recipients = [...new Set(Array.isArray(to) ? to : [to])];
    if (recipients.length === 0) return;

    const body = handler.render(data as never); // same text for everyone

    const results = await Promise.allSettled(
      recipients.map((phone) => this.sender.send(phone, body)),
    );

    const failed = recipients.filter(
      (_, i) => results[i].status === 'rejected',
    );
    if (failed.length === 0) return;

    // Retry only the recipients that failed, so successful ones are not texted twice.
    await job.updateData({ ...job.data, to: failed } as SmsJobPayload);
    throw new Error(
      `SMS failed for ${failed.length}/${recipients.length} recipients`,
    );
  }
}
