import { type CourierApi } from '@feature/actors-api/courier';
import { Delivery, Recipient } from '@feature/order-delivery-api';
import { type LocationApi } from '@feature/order-delivery-location-api';
import { type SettingsStore } from '@feature/shared';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import deliveryConfigs from './delivery.config';
import { DeliveryRepository } from './delivery.repository';
import { ReportDeliveryAttemptRequest } from './delivery.req';
import {
  InterCityDeliveryMethod,
  IntraCityDeliveryMethod,
} from './schema/delivery-method';
import { DeliverySettingsToken } from './setting/token';

@Injectable()
export class DeliveryService {
  constructor(
    private readonly settings: SettingsStore,
    private readonly location: LocationApi,
    private readonly repository: DeliveryRepository,
    private readonly courier: CourierApi,
    @Inject(deliveryConfigs.KEY)
    private readonly configs: ConfigType<typeof deliveryConfigs>,
  ) {}

  async findById(deliveryId: string): Promise<Delivery> {
    const delivery = await this.repository.findById(deliveryId);
    return;
  }

  async findAll(): Promise<Delivery[]> {
    return this.repository.findAll();
  }

  async deliver(deliveryId: string): Promise<void> {
    const delivery = await this.repository.findById(deliveryId);

    if (!delivery) throw new InternalServerErrorException();

    await this.courier.notifyPickup(delivery.id);

    await this.repository.update(delivery.id, {
      requestedAt: new Date(),
    });
  }

  async confirmPickup(deliveryId: string, courierId: string) {}

  async reportDeliveryAttempt(req: ReportDeliveryAttemptRequest) {
    const delivery = await this.courier.getDelivery(
      req.courierId,
      req.deliveryId,
    );
    if (delivery.status !== 'handed_over_to_courier') throw new Error();

    if (req.result === 'delivered') {
      if (delivery.recipient.scope === 'intra_city') {
        if (req.scope !== delivery.recipient.scope) throw new Error();

        if (
          delivery.recipient.deliveryConfirmationCode !== req.confirmationCode
        )
          throw new Error();

        await this.outbox.save({
          type: DeliverySucceededEventType,
          payload: {
            deliveryId: req.deliveryId,
            scope: 'intra_city',
          } satisfies DeliverySucceededEventPayload,
        });
        return;
      }

      if (req.scope !== delivery.recipient.scope) throw new Error();
      await this.outbox.save({
        type: DeliverySucceededEventType,
        payload: {
          deliveryId: req.deliveryId,
          scope: 'inter_city',
          trackingNumber: req.trackingNumber,
        } satisfies DeliverySucceededEventPayload,
      });

      return;
    }

    await this.outbox.save({
      type: DeliveryFailedEventType,
      payload: {
        ...req,
      } satisfies DeliveryFailedEventPayload,
    });
  }

  async cancelDelivery(req: { orderId: string }): Promise<void> {
    const delivery = await this.repository.findByOrderId(req.orderId);
    switch (delivery.status) {
      case 'initial':
      case 'courier_requested':
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

  async findCitiesByProvinces({ provinceId }: { provinceId: number }) {
    return this.location.findCitiesByProvince({ provinceId });
  }
}
