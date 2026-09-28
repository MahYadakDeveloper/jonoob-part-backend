import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const drizzleEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL must not be empty'),
});

export default registerAs('drizzle', () => {
  const data = drizzleEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
  });

  return {
    databaseUrl: data.DATABASE_URL,
  };
});
