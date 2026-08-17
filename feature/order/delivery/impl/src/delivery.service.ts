import { type SettingsStore, SettingToken } from '@feature/common';
import { DeliveryApi, DeliveryAttemptRequest } from '@feature/order-delivery-api';
import { type LocationApi } from '@feature/order-delivery-location-api';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DeliveryMethod, DeliveryMethodSchema } from './schema/delivery-method';
import { DeliverySettingsToken } from './setting/token';

@Injectable()
export class DeliveryService implements DeliveryApi {
  constructor(
    private readonly settings: SettingsStore,
    private readonly location: LocationApi,
  ) {}

  reportDeliveryAttempt(request: DeliveryAttemptRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async setMethods({ methods }: { methods: DeliveryMethod[] }) {
    // [TODO] Do this parsing line below in controller endpoint
    // z.array(DeliveryMethodSchema).parse(methods);
    await this.settings.set(DeliverySettingsToken, methods);
  }

  async getMethods() {
    await this.settings.get(DeliverySettingsToken);
  }

  findAllProvinces() {
    return this.location.listProvince();
  }

  // {
  //   "id": 1616,
  //   "name": "چمران"
  // },
  async findCitiesByProvinces({ provinceId }: { provinceId: number }) {
    return this.location.findCitiesByProvince({ provinceId });
  }
}
