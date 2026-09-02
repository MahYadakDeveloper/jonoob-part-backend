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

const DeliveryMethodMetadataSchema = z.object({
  enabled: z.boolean(),
  logoRef: z.object({
    fileId: z.string(),
    fileName: z.string(),
    mimeType: z.literal('image/svg+xml'),
  }) satisfies z.ZodType<LogoRef>,
});

export const IntraCityDeliveryMethodSchema = DeliveryMethodMetadataSchema.and(
  z.object({
    scope: z.literal('intra-city'),
    carrier: z.literal('courier'),
    cost: MoneySchema,
    freeShippingThreshold: MoneySchema.optional(),
  }),
);

export const InterCityDeliveryMethodSchema = DeliveryMethodMetadataSchema.and(
  z.object({
    scope: z.literal('inter-city'),
    carrier: z.object({
      key: z.string(),
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
);

export type IntraCityDeliveryMethod = z.infer<typeof IntraCityDeliveryMethodSchema>;
export type InterCityDeliveryMethod = z.infer<typeof InterCityDeliveryMethodSchema>;
