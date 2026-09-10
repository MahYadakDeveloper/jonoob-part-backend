import { registerAs } from '@nestjs/config';
import z from 'zod';

const baseUrlSchema = z.url().refine((value) => !value.endsWith('/'), {
  message: 'Base URL must not end with "/"',
});

export const appConfig = registerAs('app', () => ({
  webUrl: baseUrlSchema.parse(process.env.APP_WEB_URL),
  apiUrl: baseUrlSchema.parse(process.env.APP_API_URL),
  productsUrl: baseUrlSchema.parse(process.env.APP_PRODUCTS_URL),
  successfulPaymentUrl: baseUrlSchema.parse(process.env.APP_SUCCESSFUL_PAYMENT_URL),
  failurePaymentUrl: baseUrlSchema.parse(process.env.APP_FAILURE_PAYMENT_URL),

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    db: Number(process.env.REDIS_DB ?? 0),
  },
}));
