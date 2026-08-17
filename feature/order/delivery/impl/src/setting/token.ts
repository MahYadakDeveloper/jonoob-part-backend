import { SettingToken } from '@feature/common';
import { z } from 'zod';
import { DeliveryMethod, DeliveryMethodSchema } from '../schema/delivery-method';

export const DeliverySettingsToken: SettingToken<DeliveryMethod[]> = {
  defaultValue: [],
  key: 'order-delivery',
  schema: z.array(DeliveryMethodSchema),
};
