import { JwtService } from '@infra/crypto-jwt';
import { minutes, ThrottlerOptions } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import {
  adminSignInSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from './auth.dto';

export const createAuthThrottlerOption: (
  jwt: JwtService,
) => ThrottlerOptions = (jwt) => ({
  name: 'auth',
  ttl: minutes(5),
  limit: 20,
  blockDuration: minutes(5),
  skipIf: (ctx) => ctx.getClass() !== AuthController,
  getTracker: async (req) => {
    const { body } = req as { body?: any; ip?: string };

    const otpRequestBody = requestOtpSchema.safeParse(body);
    if (otpRequestBody.success) {
      return `phone:${otpRequestBody.data.phone}`;
    }

    const otpVerifyBody = verifyOtpSchema.safeParse(body);
    if (otpVerifyBody.success) {
      const p = jwt.decode(body.token);
      if (p) {
        const c = await jwt.verify(
          otpVerifyBody.data.challengeToken,
          'challenge',
        );
        if (c) return `sub:${c?.sub}`;
      }
    }

    const adminSignInBody = adminSignInSchema.safeParse(body);
    if (adminSignInBody.success) {
      const p = jwt.decode(body.token);
      if (p) {
        const c = await jwt.verify(
          adminSignInBody.data.verifyToken,
          'challenge',
        );
        if (c) return `sub:${c?.sub}`;
      }
    }

    return `ip:${req.ip}`;
  },
});
