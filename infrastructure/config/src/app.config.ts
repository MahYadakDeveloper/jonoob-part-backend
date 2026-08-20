import { registerAs } from '@nestjs/config';
import z from 'zod';

const baseUrlSchema = z.url().refine((value) => !value.endsWith('/'), {
  message: 'Base URL must not end with "/"',
});

export const appConfig = registerAs('app', () => ({
  webUrl: baseUrlSchema.parse(process.env.APP_WEB_URL),
  apiUrl: baseUrlSchema.parse(process.env.APP_API_URL),
  productsUrl: baseUrlSchema.parse(process.env.APP_PRODUCTS_URL),
}));
