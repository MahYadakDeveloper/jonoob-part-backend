import { randomInt } from 'node:crypto';

export class OtpGenerator {
  async generate(length = 4): Promise<string> {
    if (length < 4 || length > 9) {
      throw new Error('OTP length must be between 4 and 9');
    }

    // Optional: If you want to avoid leading zeros (e.g., 1000 to 9999 for length 4):
    // const min = 10 ** (length - 1);
    // const max = 10 ** length;
    // return randomInt(min, max).toString();

    // Current behavior (allows 0000 to 9999):
    const max = 10 ** length;
    return randomInt(0, max).toString().padStart(length, '0');
  }
}
