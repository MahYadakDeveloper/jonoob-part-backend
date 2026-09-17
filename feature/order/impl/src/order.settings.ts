import { SettingToken } from '@feature/common';
import { z } from 'zod';
import { CancellationFee } from './order.type';

export const orderSettingsSchema = z.object({
  cancellationFee: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('fixed'),
      amount: z.object({
        value: z.number().nonnegative(),
        unit: z.literal('toman'),
      }),
    }),
    z.object({
      type: z.literal('rate'),
      rate: z.number().min(0).max(100),
    }),
  ]),
});

export const orderSettings = {
  key: 'order-settings',

  defaultValue: {
    cancellationFee: {
      type: 'fixed',
      amount: {
        value: 0,
        unit: 'toman',
      },
    },
  },

  schema: orderSettingsSchema,
} as const satisfies SettingToken<{
  cancellationFee: CancellationFee;
}>;

export type OrderSettings = z.infer<typeof orderSettingsSchema>;
