import '@feature/authentication/sms';
import { Injectable } from '@nestjs/common';
import { SmsTemplateHandler } from '../sms-template.handler';

@Injectable()
export class OtpSmsTemplate implements SmsTemplateHandler<'auth.otp'> {
  readonly template = 'auth.otp' as const;
  render({ otp }: { otp: string }) {
    return `Your verification code is ${otp}`;
  }
}
