import { SmsJobPayload } from '@infra/messaging-sms';

declare module '@infra/messaging-sms' {
  interface SmsTemplateRegistry {
    'auth.manager-password': { password: string };
  }
}

declare interface ManagerPasswordSmsPayload extends SmsJobPayload<'auth.manager-password'> {}
