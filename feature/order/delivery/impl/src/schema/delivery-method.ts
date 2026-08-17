// import { Money } from '@feature/common';

import { Money } from '@feature/common';
import { LogoRef } from '@feature/media-api';
import { z } from 'zod';

// export type DeliveryMethod = {
//   enabled: boolean;
//   cost?: Money;
// } & (
//   | {
//       scope: 'inter-city';
//       carrier: 'courier';
//     }
//   | {
//       scope: 'intra-city';
//       carrier: {
//         provider: string;
//         displayName: string;
//         description?: string;
//         dropOffAddress?: string;
//       };
//     }
// );
// import { z } from 'zod';

const MoneySchema = z.number().transform((value) => Money.create(value));

export const DeliveryMethodSchema = z
  .object({
    enabled: z.boolean(),
    logoRef: z.object({
      fileId: z.string(),
      fileName: z.string(),
      mimeType: z.literal('image/svg+xml'),
    }) satisfies z.ZodType<LogoRef>,
  })
  .and(
    z.discriminatedUnion('scope', [
      z.object({
        scope: z.literal('intra-city'),
        carrier: z.literal('courier'),
        cost: MoneySchema,
        freeShippingThreshold: MoneySchema.optional(),
      }),

      z.object({
        scope: z.literal('inter-city'),
        carrier: z.object({
          provider: z.string(),
          shippingCostPayment: z.discriminatedUnion('variant', [
            z.object({
              variant: z.literal('prepaid'),
              cost: MoneySchema,
            }),
            z.object({
              variant: z.literal('pay-on-delivery'),
            }),
          ]),
          displayName: z.string(),
          description: z.string().optional(),
          dropOffAddress: z.string(),
        }),
      }),
    ]),
  );

export type DeliveryMethod = z.infer<typeof DeliveryMethodSchema>;
