import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const tokenConfigSchema = z.object({
  verifySecret: z
    .string({ error: 'JWT_VERIFY_SECRET is required' })
    .min(32, { error: 'JWT_VERIFY_SECRET must be at least 32 characters' }),

  accessSecret: z
    .string({ error: 'JWT_ACCESS_SECRET is required' })
    .min(32, { error: 'JWT_ACCESS_SECRET must be at least 32 characters' }),

  refreshSecret: z
    .string({ error: 'JWT_REFRESH_SECRET is required' })
    .min(32, { error: 'JWT_REFRESH_SECRET must be at least 32 characters' }),
});

export default registerAs('token', () =>
  tokenConfigSchema.parse({
    verifySecret: process.env.JWT_VERIFY_SECRET,
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  }),
);
