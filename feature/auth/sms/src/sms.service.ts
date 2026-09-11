export interface SmsService {
  sendOtpTo(phoneNumber: string, otp: string): Promise<void>;
}
