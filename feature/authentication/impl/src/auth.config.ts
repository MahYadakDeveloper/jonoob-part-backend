import { registerAs } from '@nestjs/config';
import z from 'zod';

const envSchema = z.object({
  ADMIN_SECRET_KEY: z.string().min(32),

  ADMIN_PHONE_NUMBERS: z
    .string()
    .transform((value) => value.split(',').map((phone) => phone.trim()))
    .pipe(z.array(z.string().regex(/^09\d{9}$/, 'Invalid Iranian phone number'))),

  MANAGER_SECRET_KEY: z.string().min(32),
});

export default registerAs('authentication', () => {
  const env = envSchema.parse(process.env);
  return {
    adminSecretKey: env.ADMIN_SECRET_KEY,
    adminPhoneNumbers: env.ADMIN_PHONE_NUMBERS,
    managerSecretKey: env.MANAGER_SECRET_KEY,
  };
});
