import { type SettingsStore, SettingToken } from '@feature/common';
import { DeliveryApi, DeliveryAttemptRequest } from '@feature/order-delivery-api';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DeliveryMethod, DeliveryMethodSchema } from './schema/delivery-method';

@Injectable()
export class DeliveryService implements DeliveryApi {
  private static readonly DeliverySettingsToken: SettingToken<DeliveryMethod[]> = {
    defaultValue: [],
    key: 'order-delivery',
    schema: z.array(DeliveryMethodSchema),
  };

  constructor(private readonly settings: SettingsStore) {}

  reportDeliveryAttempt(request: DeliveryAttemptRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async setMethods({ methods }: { methods: DeliveryMethod[] }) {
    // [TODO] Do this parsing line below in controller endpoint
    // z.array(DeliveryMethodSchema).parse(methods);
    await this.settings.set(DeliveryService.DeliverySettingsToken, methods);
  }

  async getMethods() {
    await this.settings.get(DeliveryService.DeliverySettingsToken);
  }
}
