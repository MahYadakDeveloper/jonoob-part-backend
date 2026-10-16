import { z } from 'zod';

export const orderSettingsSchema = z.object({
  cancellationFee: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('fixed'),
      amount: z.number().int(),
    }),
    z.object({
      type: z.literal('rate'),
      rate: z.number().min(0).max(1),
    }),
  ]),
});

export const orderSettings = {
  key: 'order-settings',

  defaultValue: {
    cancellationFee: {
      type: 'fixed',
      amount: 0,
    },
  },

  schema: orderSettingsSchema,
} as const;

export type OrderSettings = z.infer<typeof orderSettingsSchema>;
