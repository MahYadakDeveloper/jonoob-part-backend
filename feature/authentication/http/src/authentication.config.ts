import { registerAs } from '@nestjs/config';
import ms from 'ms';
import z from 'zod';

const envSchema = z.object({
  CHALLENGE_SECRET: z
    .string({ error: 'CHALLENGE_SECRET is required' })
    .min(32, { error: 'CHALLENGE_SECRET must be at least 32 characters' }),

  VERIFY_SECRET: z
    .string({ error: 'VERIFY_SECRET is required' })
    .min(32, { error: 'VERIFY_SECRET must be at least 32 characters' }),

  ACCESS_SECRET: z
    .string({ error: 'ACCESS_SECRET is required' })
    .min(32, { error: 'ACCESS_SECRET must be at least 32 characters' }),

  REFRESH_SECRET: z
    .string({ error: 'REFRESH_SECRET is required' })
    .min(32, { error: 'REFRESH_SECRET must be at least 32 characters' }),

  ADMIN_SECRET_KEY: z.string().min(32),

  ADMIN_PHONE_NUMBERS: z
    .string()
    .transform((value) => value.split(',').map((phone) => phone.trim()))
    .pipe(
      z.array(
        z.string().regex(/^09\d{9}$/, 'Phone number must be in 09… format'),
      ),
    )
    .transform((phones) => phones.map((phone) => phone.replace(/^0/, '+98'))),
});

export default registerAs('authentication', () => {
  const env = envSchema.parse(process.env);
  return {
    challengeSecret: env.CHALLENGE_SECRET,
    verifySecret: env.VERIFY_SECRET,
    accessSecret: env.ACCESS_SECRET,
    refreshSecret: env.REFRESH_SECRET,

    adminSecretKey: env.ADMIN_SECRET_KEY,
    adminPhoneNumbers: env.ADMIN_PHONE_NUMBERS,

    otpLength: 6,
    otpMaxAttempts: 3,

    ...({
      otpExpiresIn: '3m' satisfies ms.StringValue,
      verifyTokenExpiresIn: '5m',
      accessTokenExpiresIn: '15m',
      refreshTokenExpiresIn: '7d',
    } satisfies Record<string, ms.StringValue>),
  } as const;
});
