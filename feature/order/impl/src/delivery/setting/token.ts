import { SettingToken } from '@infra/settings-store';
import { z } from 'zod';
import {
  InterCityDeliveryMethod,
  InterCityDeliveryMethodSchema,
  IntraCityDeliveryMethod,
  IntraCityDeliveryMethodSchema,
} from '../delivery.schema';

export const DeliverySettingsToken: SettingToken<
  [] | [IntraCityDeliveryMethod, ...InterCityDeliveryMethod[]]
> = {
  defaultValue: [],
  key: 'order-delivery',
  schema: z
    .tuple([IntraCityDeliveryMethodSchema])
    .rest(InterCityDeliveryMethodSchema)
    .refine((methods) => {
      const carriers = new Set<string>();

      for (const method of methods) {
        if (method.scope === 'intra-city') continue;

        if (carriers.has(method.carrier.key)) {
          return false;
        }

        carriers.add(method.carrier.key);
      }

      return true;
    }),
};
