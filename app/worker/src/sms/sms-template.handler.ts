import {
  SmsTemplate,
  SmsTemplateRegistry,
} from '@infra/messaging-queue/job-types';

// libs/queue/src/sms-template-handler.ts
export interface SmsTemplateHandler<T extends SmsTemplate = SmsTemplate> {
  readonly template: T;
  render(data: SmsTemplateRegistry[T]): string;
}

export const SMS_TEMPLATE_HANDLERS = Symbol('SMS_TEMPLATE_HANDLERS');
