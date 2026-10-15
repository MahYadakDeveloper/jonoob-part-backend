import { z } from 'zod';

export const ConfirmPickupSchema = z
  .object({
    courierId: z.uuid(),
  })
  .strict();

export interface ConfirmPickupDto extends z.infer<typeof ConfirmPickupSchema> {}
