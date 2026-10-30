import { registerAs } from '@nestjs/config';
import z from 'zod';

const envSchema = z.object({
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
    adminSecretKey: env.ADMIN_SECRET_KEY,
    adminPhoneNumbers: env.ADMIN_PHONE_NUMBERS,
  };
});
