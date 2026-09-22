import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const drizzleEnvSchema = z.object({
  PG_DATABASE_URL: z.string().min(1, 'DATABASE_URL must not be empty'),
});

export default registerAs('prisma', () => {
  const data = drizzleEnvSchema.parse({
    PG_DATABASE_URL: process.env.PG_DATABASE_URL,
  });

  return {
    databaseUrl: data.PG_DATABASE_URL,
  };
});
