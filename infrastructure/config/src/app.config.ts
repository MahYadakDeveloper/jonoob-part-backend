import { registerAs } from '@nestjs/config';
import z from 'zod';

export const appConfig = registerAs('app', () => ({
  webUrl: z.url().parse(process.env.APP_WEB_URL),
}));
