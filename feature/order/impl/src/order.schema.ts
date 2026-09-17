import { phoneNumberSchema } from '@feature/common';
import { IntraCityRecipient } from '@feature/order-delivery-api';
import { z } from 'zod';

export const recordOrderSchema = z.object({
  customerId: z.uuid(),
  items: z
    .array(z.object({ productId: z.string(), quantity: z.coerce.number().int().positive() }))
    .transform((val) => val.toLineItems((item) => item.productId)),
  recipient: z.discriminatedUnion('scope', [
    z.object({
      scope: z.literal('inter_city'),
      address: z.string(),
      carrierKey: z.string(),
      cityId: z.coerce.number(),
      provinceId: z.coerce.number(),
      postalCode: z.coerce.string(),
      customerPhoneNumber: phoneNumberSchema,
    }),
    z.object({
      scope: z.literal('intra_city'),
      cityId: z.coerce.number(),
      address: z.string(),
      coordinate: (
        z.object({
          latitude: z.number(),
          longitude: z.number(),
        }) satisfies z.ZodType<IntraCityRecipient['coordinate']>
      ).optional(),
      customerPhoneNumber: phoneNumberSchema,
    }) satisfies z.ZodType<
      Omit<IntraCityRecipient, 'customer'> & {
        customerPhoneNumber: string;
      }
    >,
  ]),
});

export type RecordOrderType = z.infer<typeof recordOrderSchema>;
