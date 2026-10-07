import { registerAs } from '@nestjs/config';
import { z } from 'zod';

// Treat empty strings (e.g. `REDIS_USERNAME=`) as "not set"
const optionalString = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? v : undefined));

const redisEnvSchema = z.object({
  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_DB: z.coerce.number().int().min(0).max(15).default(0),
  REDIS_USERNAME: optionalString,
  REDIS_PASSWORD: optionalString,
});

export const redisConfig = registerAs('redis', () => {
  const result = redisEnvSchema.safeParse(process.env);

  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid Redis configuration: ${details}`);
  }

  const env = result.data;

  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    database: env.REDIS_DB,
    username: env.REDIS_USERNAME,
    password: env.REDIS_PASSWORD,
  };
});

export type RedisConfig = ReturnType<typeof redisConfig>;
