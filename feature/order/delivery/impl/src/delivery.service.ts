import { type OutboxRepository, type SettingsStore } from '@feature/common';
import { Delivery, DeliveryApi, Recipient } from '@feature/order-delivery-api';
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

  async findOne(req: { deliveryId: string }): Promise<{ delivery: { id: string } & Delivery }> {
    const delivery = await this.repository.findById(req.deliveryId);
    return { delivery };
  }

  async initialize({
    orderId,
    recipient,
  }: {
    orderId: string;
    recipient: Recipient;
  }): Promise<void> {
    await this.repository.create(orderId, recipient);
  }

  async deliver({ orderId }: { orderId: string }): Promise<void> {
    const delivery = await this.repository.findByOrderId(orderId);
    await this.courier.pickup({ deliveryId: delivery.id });
    await this.repository.markAsCourierRequested(orderId, {
      requestedAt: new Date(),
    });
  }

  async cancelDelivery(req: { orderId: string }): Promise<void> {
    const delivery = await this.repository.findByOrderId(req.orderId);
    switch (delivery.status) {
      case 'initial':
      case 'courier_requested':
        await this.courier.cancelPickupRequest({ deliveryId: delivery.id });
        await this.repository.markAsCanceled(delivery.id, {
          canceledAt: new Date(),
        });
        return;
      default:
        throw new Error('This feature not implemented yet!');
    }
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
