import { minutes, ThrottlerOptions } from '@nestjs/throttler';
import { AuthenticationController } from './authentication.controller';
import {
  adminSignInSchema,
  refreshSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from './authentication.dto';
import { JwtAuthService } from './jwt-auth.service';

export const createAuthThrottlerOption: (
  jwt: JwtAuthService,
) => ThrottlerOptions = (jwt) => ({
  name: 'auth',
  ttl: minutes(5),
  limit: 20,
  blockDuration: minutes(5),
  skipIf: (ctx) => ctx.getClass() !== AuthenticationController,
  getTracker: async (req) => {
    const { body } = req as { body?: any; ip?: string };

    const otpRequestBody = requestOtpSchema.safeParse(body);
    if (otpRequestBody.success) {
      return `phone:${otpRequestBody.data.phone}`;
    }

    // support different sign-in's endpoints and verifyOtp endpoint
    try {
      const otpVerifyBody = verifyOtpSchema.parse(body);
      const c = await jwt.verify(otpVerifyBody.challengeToken, 'challenge');

      if (c) return `otp-challenge:${otpVerifyBody.challengeToken}`;
    } catch {}

    try {
      const adminSignInBody = adminSignInSchema.parse(body);
      const c = await jwt.verify(adminSignInBody.verifyToken, 'verify');
      if (c) return `verify:${adminSignInBody.verifyToken}`;
    } catch {}

    try {
      const refresh = refreshSchema.parse(body);
      const c = await jwt.verify(refresh.refreshToken, 'refresh');
      if (c) return `refresh:${refresh.refreshToken}`;
    } catch {}

    return `ip:${req.ip}`;
  },
});
