import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const prismaEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL must not be empty')
    .url('DATABASE_URL must be a valid URL'),
});

export default registerAs('prisma', () => {
  const data = prismaEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
  });

  return {
    databaseUrl: data.DATABASE_URL,
  };
});
