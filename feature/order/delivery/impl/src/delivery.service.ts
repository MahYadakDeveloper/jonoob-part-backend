import { type OutboxRepository, type SettingsStore } from '@feature/common';
import {
  Delivery,
  DeliveryApi,
  DeliveryAttemptRequest,
  PackageDeliveredEventPayload,
  PackageDeliveredEventType,
  PackageDeliveryFailedEventPayload,
  PackageDeliveryFailedEventType,
} from '@feature/order-delivery-api';
import { type CourierApi } from '@feature/order-delivery-courier-api';
import { type LocationApi } from '@feature/order-delivery-location-api';
import { Injectable } from '@nestjs/common';
import { type DeliveryRepository } from './delivery.repository';
import { InterCityDeliveryMethod, IntraCityDeliveryMethod } from './schema/delivery-method';
import { DeliverySettingsToken } from './setting/token';

@Injectable()
export class DeliveryService implements DeliveryApi {
  constructor(
    private readonly settings: SettingsStore,
    private readonly location: LocationApi,
    private readonly outbox: OutboxRepository,
    private readonly repository: DeliveryRepository,
    private readonly courier: CourierApi,
  ) {}

  async cancelDelivery(req: { orderId: string }): Promise<void> {
    const delivery = await this.repository.findByOrderId(req.orderId);
    switch (delivery.status) {
      case 'courier-requested':
        await this.courier.cancelPickupRequest({ deliveryId: delivery.id });
        return;
      default:
        throw new Error('This feature not implemented yet!');
    }
  }

  async findDelivery(req: { orderId: string }): Promise<{ delivery: { id: string } & Delivery }> {
    const delivery = await this.repository.findByOrderId(req.orderId);
    return { delivery };
  }

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

  async setMethods({
    methods,
  }: {
    methods: [] | [IntraCityDeliveryMethod, ...InterCityDeliveryMethod[]];
  }) {
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
