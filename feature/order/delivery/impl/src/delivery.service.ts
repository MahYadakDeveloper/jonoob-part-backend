import { type OutboxRepository, type SettingsStore } from '@feature/common';
import {
  DeliveryApi,
  DeliveryAttemptRequest,
  PackageDeliveredEventPayload,
  PackageDeliveredEventType,
  PackageDeliveryFailedEventPayload,
  PackageDeliveryFailedEventType,
} from '@feature/order-delivery-api';
import { type LocationApi } from '@feature/order-delivery-location-api';
import { Injectable } from '@nestjs/common';
import { DeliveryMethod } from './schema/delivery-method';
import { DeliverySettingsToken } from './setting/token';

@Injectable()
export class DeliveryService implements DeliveryApi {
  constructor(
    private readonly settings: SettingsStore,
    private readonly location: LocationApi,
    private readonly outbox: OutboxRepository,
  ) {}

  /**
   *
   */
  async reportDeliveryAttempt(req: DeliveryAttemptRequest): Promise<void> {
    if (req.result === 'delivered') {
      await this.outbox.save({
        type: PackageDeliveredEventType,
        payload: {
          ...req,
        } satisfies PackageDeliveredEventPayload,
      });

      return;
    }

    await this.outbox.save({
      type: PackageDeliveryFailedEventType,
      payload: {
        attempt: req,
      } satisfies PackageDeliveryFailedEventPayload,
    });
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
