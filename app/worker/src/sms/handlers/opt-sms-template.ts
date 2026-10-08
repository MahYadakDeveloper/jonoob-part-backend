import { Injectable } from '@nestjs/common';
import { SmsTemplateHandler } from '../sms-template.handler';
import '@feature/authentication/sms';

@Injectable()
export class OtpSmsTemplate implements SmsTemplateHandler<'otp'> {
  readonly template = 'otp' as const;
  render({ otp }: { otp: string }) {
    return `Your verification code is ${otp}`;
  }
}
