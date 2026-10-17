import { registerAs } from '@nestjs/config';
import z from 'zod';

const baseUrlSchema = z.url().refine((value) => !value.endsWith('/'), {
  message: 'Base URL must not end with "/"',
});

const endpointSchema = z.string().min(1).startsWith('/', {
  message: 'Endpoint must start with "/"',
});

export const azkivamConfig = registerAs('azkivam', () => ({
  baseUrl: baseUrlSchema.default('https://api.azkivam.com').parse(process.env.AZKIVAM_BASE_URL),

  username: z.string().min(1).parse(process.env.AZKIVAM_USERNAME),
  password: z.string().min(1).parse(process.env.AZKIVAM_PASSWORD),

  merchantId: z.string().min(1).parse(process.env.AZKIVAM_MERCHANT_ID),

  authenticateEndpoint: endpointSchema.parse(process.env.AZKIVAM_AUTHENTICATE_ENDPOINT),
  refreshTokenEndpoint: endpointSchema.parse(process.env.AZKIVAM_REFRESH_TOKEN_ENDPOINT),
  createTicketEndpoint: endpointSchema.parse(process.env.AZKIVAM_CREATE_TICKET_ENDPOINT),
  verifyTicketEndpoint: endpointSchema.parse(process.env.AZKIVAM_VERIFY_TICKET_ENDPOINT),
  ticketStatusEndpoint: endpointSchema.parse(process.env.AZKIVAM_TICKET_STATUS_ENDPOINT),
}));
