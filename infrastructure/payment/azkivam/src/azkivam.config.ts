import { registerAs } from '@nestjs/config';
import z from 'zod';

const baseUrlSchema = z.url().refine((value) => !value.endsWith('/'), {
  message: 'Base URL must not end with "/"',
});

const endpointSchema = z.string().min(1).startsWith('/', {
  message: 'Endpoint must start with "/"',
});

export const azkivamConfig = registerAs('azkivam', () => ({
  baseUrl: baseUrlSchema.parse(process.env.AZKIVAM_BASE_URL),

  username: z.string().min(1).parse(process.env.AZKIVAM_USERNAME),
  password: z.string().min(1).parse(process.env.AZKIVAM_PASSWORD),

  merchantId: z.string().min(1).parse(process.env.AZKIVAM_MERCHANT_ID),

  authenticationEndpoint: endpointSchema.parse(process.env.AZKIVAM_AUTHENTICATION_ENDPOINT),
  createTicketEndpoint: endpointSchema.parse(process.env.AZKIVAM_CREATE_TICKET_ENDPOINT),
  verifyTicketEndpoint: endpointSchema.parse(process.env.AZKIVAM_VERIFY_TICKET_ENDPOINT),
}));
