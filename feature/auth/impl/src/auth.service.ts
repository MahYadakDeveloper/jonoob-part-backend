import { type HashService } from '@feature/auth-hashing';
import { type TokenService } from '@feature/auth-token';
import { type CustomersApi } from '@feature/customer-api';
import { Injectable } from '@nestjs/common';
import { type OtpStore } from './port/otp.store';

/**
 * [NOTE]
 * For opt store implementation use redis
 *
 * [NOTE]
 * Flow of singUp/singIn:
 * - client app need to check customer is already singed up:
 *  # [already singed up]:
 *    - request otp
 *    - sing in
 *  # [required to sing up]:
 *    - gets required data from user (fullName)
 *    - then request otp
 *    - sing in
 * - then customer has would achieve a token
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly customers: CustomersApi,
    private readonly otpStore: OtpStore,
    private readonly tokenService: TokenService,
    private readonly hashService: HashService,
  ) {}

  async requestOtp() {}

  /**
   *
   */
  async signIn({ phoneNumber, otp }: { phoneNumber: string; otp: string }) {
    this.verify(phoneNumber, otp);

    const { customer } = await this.customers.findByPhoneNumber({ phoneNumber });

    // [TODO] ...(generate token and return it)
  }

  /**
   *
   */
  async signUp({
    fullName,
    phoneNumber,
    otp,
  }: {
    phoneNumber: string;
    fullName: string;
    otp: string;
  }) {
    const { exists } = await this.customers.existsByPhoneNumber({ phoneNumber });
    if (exists) throw new Error();

    await this.customers.create({
      type: 'consumer',
      fullName,
      phoneNumber,
    });

    // ...
  }

  /**
   * Generate new token
   *
   * [NOTE]
   * Useful for client side app that if customer is active and app
   * check if token is n hours left to expire then app can refresh
   */
  refresh() {}

  private async verify(phoneNumber: string, otp: string): Promise<void> {
    const record = await this.otpStore.get(phoneNumber);

    if (!record) {
      throw new Error('OTP not found or expired');
    }

    if (record.attempts > record.maxAttempts) throw new Error();

    const valid = await this.hashService.verify(otp, record.hash);

    if (!valid) {
      await this.otpStore.incrementAttempts(phoneNumber);
      throw new Error('Invalid OTP');
    }

    await this.otpStore.delete(phoneNumber);
  }
}
