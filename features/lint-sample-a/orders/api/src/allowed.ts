// ALLOWED for api: its own package and any external package
import { FastifyRequest } from 'fastify';
import { SAMPLE_A_ORDERS_API } from './index';

export const ALLOWED = [
  SAMPLE_A_ORDERS_API, // same package
  (_request: FastifyRequest) => undefined, // external (free outside impl)
];
