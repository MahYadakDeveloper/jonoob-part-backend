import { CourierApi, Courier as CourierDto } from '@feature/actors-api/courier';
import { SMS_QUEUE_NAME } from '@infra/messaging-queue/constants';
import { SmsJobs } from '@infra/messaging-queue/job-types';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Courier, CourierRepository } from './courier.repository';
import { SmsPickupRequestJobPayload } from './sms/pickup-request.template';

@Injectable()
export class CourierApiImpl implements CourierApi {
  constructor(
    @Inject(SMS_QUEUE_NAME) private readonly smsQueue: Queue,
    private readonly repository: CourierRepository,
  ) {}

  findById(courierId: string): Promise<CourierDto> {
    return this.repository.findById(courierId).then((courier) => {
      if (!courier) throw new Error();

      return toDto(courier);
    });
  }

  findByPhoneNumber(phone: string): Promise<CourierDto> {
    return this.repository.findByPhone(phone).then((courier) => {
      if (!courier) throw new Error();

      return toDto(courier);
    });
  }

  async notifyPickup(deliveryId: string): Promise<void> {
    const couriers = await this.repository.findAll();

    await this.smsQueue.add(SmsJobs.Send, {
      to: couriers.map((c) => c.phone),
      template: 'delivery.pickup-request',
      data: {
        deliveryId,
      },
    } satisfies SmsPickupRequestJobPayload);
  }
}

function toDto({ deliveries, phone, ...rest }: Courier): CourierDto {
  return {
    ...rest,
    phoneNumber: phone,
  };
}
