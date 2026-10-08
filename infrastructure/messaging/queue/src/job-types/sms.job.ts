export const SmsJobs = {
  Send: 'sms.send',
} as const;

/**
 * Registry of templates -> data shape.
 * Empty here. Each feature augments it with its own template.
 */
export interface SmsTemplateRegistry {}

export type SmsTemplate = keyof SmsTemplateRegistry;

export interface SmsJobPayload<T extends SmsTemplate = SmsTemplate> {
  to: string;
  template: T;
  data: SmsTemplateRegistry[T];
}
