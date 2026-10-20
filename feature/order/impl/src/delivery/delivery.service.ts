import type { CourierApi } from '@feature/actors-api/courier';
import { DrizzleTransactionContext } from '@infra/db-drizzle';
import { deliveries } from '@infra/db-drizzle/schema';
import { SMS_QUEUE_NAME } from '@infra/messaging-queue/constants';
import { SmsJobs } from '@infra/messaging-queue/job-types';
import { DrizzleSettingsStore } from '@infra/settings-store';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { Outbox } from '@nestjs/outbox';
import { Queue } from 'bullmq';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { LocationsQuery } from '../locations/locations.query';
import { SmsDeliveryOutForDeliveryJobPayload } from '../sms/sms-opt.template';
import { assertReportAllowedForScope } from './delivery.asserts';
import deliveryConfigs from './delivery.config';
import { DeliveryRepository } from './delivery.repository';
import { DeliveryAttemptReportDto } from './delivery.schema';
import { DeliverySettingsToken } from './setting/token';

@Injectable()
export class DeliveryService {
  constructor(
    private readonly courier: CourierApi,
    private readonly settingsStore: DrizzleSettingsStore,
    private readonly location: LocationsQuery,
    private readonly repository: DeliveryRepository,
    @Inject(deliveryConfigs.KEY)
    private readonly configs: ConfigType<typeof deliveryConfigs>,
    private readonly tx: DrizzleTransactionContext,
    @InjectQueue(SMS_QUEUE_NAME) private readonly smsQueue: Queue,
    private readonly outbox: Outbox,
  ) {}

  async getAssignedCourierId(deliveryId: string) {
    const courierId = await this.repository.findAssignedCourierId(deliveryId);
    if (!courierId)
      throw new UnprocessableEntityException('Courier not assigned');

    return courierId;
  }

  async findById(deliveryId: string) {
    const delivery = await this.repository.findById(deliveryId);
    if (!delivery)
      throw new NotFoundException(`Delivery not found: ${deliveryId}`);

    return delivery;
  }

  async findAll() {
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

  async confirmPickup(deliveryId: string, courierId: string) {
    await this.tx.run(async () =>
      this.repository.withLock(
        'delivery',
        `pickup-confirm:${deliveryId}`,
        async () => {
          const delivery = await this.repository.findById(deliveryId);

          this.assertDeliveryExists(delivery);

          if (delivery.status !== 'courier_requested') {
            throw new ConflictException('Delivery is already picked up');
          }

          const confirmationCode = this.generateCode(6);

          await this.smsQueue.add(SmsJobs.Send, {
            to: delivery.recipient.customerContact.phone,
            template: 'delivery.out-for-delivery',
            data: {
              confirmationCode,
            },
          } satisfies SmsDeliveryOutForDeliveryJobPayload);

          await this.repository.update(deliveryId, {
            courierId,
            handedOverAt: new Date(),
            confirmationCode,
          });
        },
      ),
    );
  }

  async reportDeliveryAttempt(
    deliveryId: string,
    report: DeliveryAttemptReportDto,
  ) {
    return this.tx.run(async () =>
      this.repository.withLock(
        'delivery',
        `report_attempt:${deliveryId}`,
        async () => {
          const delivery = await this.repository.findById(deliveryId);

          this.assertDeliveryExists(delivery);

          assertReportAllowedForScope(delivery.recipient.scope, report);

          if (report.outcome === 'failed') {
            const inserted = await this.repository.createDeliveryAttemptReport({
              deliveryId,
              outcome: 'failed',
              reason: report.reason,
              reasonMessage: report.reasonMessage,
            });

            if (inserted.length === 0)
              throw new UnprocessableEntityException(
                'Delivery attempt report not created. try again!',
              );

            return;
          }

          if (delivery.recipient.scope === 'intra_city') {
            if (delivery.confirmationCode !== report.confirmationCode!)
              throw new BadRequestException('');
          }

          await this.repository.createDeliveryAttemptReport({
            deliveryId,
            outcome: 'delivered',
          });

          await this.repository.update(delivery.id, {
            status: 'delivered',
            deliveredAt: new Date(),
            trackingNumber: report.trackingNumber,
          });

          await this.outbox.add(this.tx.current, {
            topic: 'delivery:delivered',
            payload: { orderId: delivery.orderId },
          });
        },
      ),
    );
  }

  async receiveReturnedDelivery(deliveryId: string) {
    await this.tx.run(async () =>
      this.repository.withLock(
        'delivery',
        `returning_to_warehouse:${deliveryId}`,
        async () => {
          const delivery = await this.repository.findById(deliveryId);

          this.assertDeliveryExists(delivery);

          await this.repository.update(delivery.id, {
            status: 'returned_to_warehouse',
            returnedAt: new Date(),
          });

          await this.outbox.add(this.tx.current, {
            topic: 'delivery:returned_to_warehouse',
            payload: { orderId: delivery.orderId },
          });
        },
      ),
    );
  }

  async cancelDelivery(deliveryId: string): Promise<void> {
    const delivery = await this.repository.findById(deliveryId);
    this.assertDeliveryExists(delivery);

    switch (delivery.status) {
      case 'pending':
      case 'courier_requested': {
        await this.repository.update(delivery.id, {
          status: 'canceled',
          canceledAt: new Date(),
        });
        return;
      }

      case 'canceled':
        return;

      case 'handed_over_to_courier':
      case 'delivered':
      case 'returned_to_warehouse':
        throw new ConflictException(
          `Delivery cannot be canceled in status "${delivery.status}"`,
        );

      default: {
        const _exhaustive: never = delivery.status;
        throw new Error(`Unhandled delivery status: ${String(_exhaustive)}`);
      }
    }
  }

  async setSettings(settings: z.infer<typeof DeliverySettingsToken.schema>) {
    await this.settingsStore.set(DeliverySettingsToken, settings);
  }

  async getSettings() {
    await this.settingsStore.get(DeliverySettingsToken);
  }

  listProvinces() {
    return this.location.listProvinces();
  }

  listCitiesByProvinceId(provinceId: number) {
    return this.location.listCitiesByProvinceId(provinceId);
  }

  private assertDeliveryExists(
    delivery: typeof deliveries.$inferSelect | null | undefined,
  ): asserts delivery is typeof deliveries.$inferSelect {
    if (!delivery) throw new NotFoundException('Delivery not found');
  }

  private generateCode(length = 4): string {
    if (length < 4 || length > 9) {
      throw new Error('OTP length must be between 4 and 9');
    }

    const max = 10 ** length;

    return randomInt(0, max).toString().padStart(length, '0');
  }
}
