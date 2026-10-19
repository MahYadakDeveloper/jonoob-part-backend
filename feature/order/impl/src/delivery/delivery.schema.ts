import { LogoRef } from '@feature/media-api';
import { intraCityDeliveryFailureReasons } from '@infra/db-drizzle/schema';
import { z } from 'zod';

export type InterCityDeliveryFailureReasons =
  (typeof intraCityDeliveryFailureReasons.enumValues)[number];

const InterCityDeliveryFailureReasonsSchema = z.enum(
  intraCityDeliveryFailureReasons.enumValues,
);

export const DeliveryAttemptReportSchema = z.discriminatedUnion('outcome', [
  z
    .object({
      outcome: z.literal('delivered'),
      confirmationCode: z
        .string()
        .trim()
        .regex(/^\d{6}$/, 'Code must be exactly 6 digits')
        .optional(),
      trackingNumber: z.string().max(32).optional(),
    })
    .strict()
    .refine(
      (val) =>
        val.confirmationCode !== undefined || val.trackingNumber !== undefined,
      {
        message:
          'At least one of confirmationCode or trackingNumber is required',
        path: ['confirmationCode'],
      },
    ),
  z
    .object({
      outcome: z.literal('failed'),
      reason: InterCityDeliveryFailureReasonsSchema,
      reasonMessage: z.string().max(500).optional(),
      // here...
    })
    .strict()
    .superRefine((val, ctx) => {
      if (val.reason === 'other' && !val.reasonMessage) {
        ctx.addIssue({
          code: 'custom',
          path: ['reasonMessage'],
          message: 'reasonMessage is required when reason is "other"',
        });
      }
      if (val.reason !== 'other' && val.reasonMessage !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['reasonMessage'],
          message: 'reasonMessage is only allowed when reason is "other"',
        });
      }
    }),
]);

export const ConfirmPickupSchema = z
  .object({
    courierId: z.uuid(),
  })
  .strict();

export interface ConfirmPickupDto extends z.infer<typeof ConfirmPickupSchema> {}

export type DeliveryAttemptReportDto = z.infer<
  typeof DeliveryAttemptReportSchema
>;

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
    cost: z.number().int(),
    freeShippingThreshold: z.number().int().optional(),
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
          cost: z.number().int(),
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

export type IntraCityDeliveryMethod = z.infer<
  typeof IntraCityDeliveryMethodSchema
>;
export type InterCityDeliveryMethod = z.infer<
  typeof InterCityDeliveryMethodSchema
>;
