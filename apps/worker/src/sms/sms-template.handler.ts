import { SmsTemplate, SmsTemplateRegistry } from '@infra/messaging-sms';

export interface SmsTemplateHandler<T extends SmsTemplate = SmsTemplate> {
  readonly template: T;
  render(data: SmsTemplateRegistry[T]): string;
}

export const SMS_TEMPLATE_HANDLERS = Symbol('SMS_TEMPLATE_HANDLERS');
