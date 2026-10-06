import { quarantineSortableFields } from '@/services/repositories/quarantine.repository';
import { createPageQuerySchema } from './utils';
import { z } from 'zod';

export const quarantinesPageQuerySchema = createPageQuerySchema(
  quarantineSortableFields,
  '-createdAt',
);

export type QuarantinesPageQuery = z.infer<typeof quarantinesPageQuerySchema>;
