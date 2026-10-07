import { type OtpGenerator } from '@feature/common';
import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';

@Injectable()
export class CryptoOtpGenerator implements OtpGenerator {
  generate(length = 4): string {
    if (length < 4 || length > 9) {
      throw new Error('OTP length must be between 4 and 9');
    }

    const max = 10 ** length;

    return randomInt(0, max).toString().padStart(length, '0');
  }
}
