import { SmsJobPayload } from '@infra/messaging-queue/job-types';

declare module '@infra/messaging-queue/job-types' {
  interface SmsTemplateRegistry {
    otp: { otp: string };
  }
}

export type SmsSendOtpJobPayload = SmsJobPayload<'otp'>;
