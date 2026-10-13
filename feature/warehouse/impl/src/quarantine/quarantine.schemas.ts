import { z } from 'zod';
import { createPageQuerySchema } from '../utils';
import { quarantineSortableFields } from './quarantine.repository';

export const quarantinesPageQuerySchema = createPageQuerySchema(
  quarantineSortableFields,
  '-createdAt',
);

export type QuarantinesPageQuery = z.infer<typeof quarantinesPageQuerySchema>;
