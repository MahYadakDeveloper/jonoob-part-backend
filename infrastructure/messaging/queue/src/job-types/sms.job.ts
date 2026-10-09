export const SmsJobs = {
  Send: 'sms.send',
} as const;

export interface SmsTemplateRegistry {} // each feature augments this

export type SmsTemplate = keyof SmsTemplateRegistry;

export type SmsJobPayload<T extends SmsTemplate = SmsTemplate> = {
  [K in T]: {
    to: string | string[];
    template: K;
    data: SmsTemplateRegistry[K];
  };
}[T];
