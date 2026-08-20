import { registerAs } from '@nestjs/config';
import z from 'zod';

export const azkivamConfig = registerAs('azkivam', () => ({
  baseUrl: z.url().parse(process.env.AZKIVAM_BASE_URL),

  username: z.string().min(1).parse(process.env.AZKIVAM_USERNAME),
  password: z.string().min(1).parse(process.env.AZKIVAM_PASSWORD),

  createTicketEndpoint: z.string().min(1).parse(process.env.AZKIVAM_CREATE_TICKET_ENDPOINT),
  verifyTicketEndpoint: z.string().min(1).parse(process.env.AZKIVAM_VERIFY_TICKET_ENDPOINT),
}));
