import { SmsJobPayload } from '@infra/messaging-sms';

declare module '@infra/messaging-sms' {
  interface SmsTemplateRegistry {
    'auth.otp': { otp: string };
  }
}

declare interface OtpSmsPayload extends SmsJobPayload<'auth.otp'> {}
