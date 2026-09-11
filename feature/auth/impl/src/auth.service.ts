import { type HashService } from '@feature/auth-hashing';
import { type RateLimitService, TokenBucketConfig } from '@feature/auth-rate-limit';
import { type SmsService } from '@feature/auth-sms';
import { type TokenService } from '@feature/auth-token';
import { type OtpGenerator } from '@feature/common';
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
  // otp
  private readonly otpRateLimitConfig: TokenBucketConfig = {
    maxTokens: 1,
    refillRate: 8.333e-3, // refill a token in 2 min
  };
  private readonly otpTtl = 5000; // in millisecond
  private readonly otpLength = 4;

  private readonly phoneNumberRateLimitConfig: TokenBucketConfig = {
    maxTokens: 3,
    refillRate: 3.333e-3, // refill a token in 5 min
  };

  private readonly ipRateLimitConfig: TokenBucketConfig = {
    maxTokens: 10,
    refillRate: 3.333e-3, // refill a token in 5 min
  };

  constructor(
    private readonly customers: CustomersApi,
    private readonly otpStore: OtpStore,
    private readonly tokenService: TokenService,
    private readonly hashService: HashService,
    private readonly rateLimit: RateLimitService,
    private readonly sms: SmsService,
    private readonly otpGenerator: OtpGenerator,
  ) {}

  /**
   * [NOTE]
   * This is responsible too for `Able to re-request and check` functionality
   * so there no need for separated method for check requirement(otp-resending)
   *
   * [TODO] Add phone number validation inside the endpoint controller
   */
  async request({ phoneNumber, ip }: { phoneNumber: string; ip: string }) {
    const result = await this.rateLimit.attempt([
      {
        key: `otp-${phoneNumber}`,
        config: this.otpRateLimitConfig,
      },
      {
        key: `phone-${phoneNumber}`,
        config: this.phoneNumberRateLimitConfig,
      },
      {
        key: `ip-${ip}`,
        config: this.ipRateLimitConfig,
      },
    ]);

    if (!result.allowed) {
      const { retryAfter } = result;
      return {
        retryAfter,
      };
    }

    const otp = this.otpGenerator.generate(this.otpLength);

    await this.otpStore.set(
      phoneNumber,
      {
        hash: await this.hashService.hash(otp),
      },
      this.otpTtl,
    );

    await this.sms.sendOtpTo(phoneNumber, otp);
  }

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

    // if (record.attempts > record.maxAttempts) throw new Error();

    const valid = await this.hashService.verify(otp, record.hash);

    if (!valid) {
      await this.otpStore.incrementAttempts(phoneNumber);
      throw new Error('Invalid OTP');
    }

    await this.otpStore.delete(phoneNumber);
  }
}
