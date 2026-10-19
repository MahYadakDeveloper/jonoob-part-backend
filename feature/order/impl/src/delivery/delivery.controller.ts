import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import {
  ConfirmPickupSchema,
  DeliveryAttemptReportSchema,
  type ConfirmPickupDto,
  type DeliveryAttemptReportDto,
} from './delivery.schema';
import { DeliveryService } from './delivery.service';

@Controller()
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}
  @Get()
  findAll() {
    return this.delivery.findAll();
  }

  // [TODO] Add guard and ability
  @Post(':id/confirm-pickup')
  confirmPickup(
    @Param('id', { schema: z.uuid() }) id: string,
    @Body({ schema: ConfirmPickupSchema }) dto: ConfirmPickupDto,
  ) {
    return this.delivery.confirmPickup(id, dto.courierId);
  }

  @Post(':id/attempts')
  reportDeliveryAttempt(
    @Param('id', { schema: z.uuid() }) deliveryId: string,
    @Body({ schema: DeliveryAttemptReportSchema })
    report: DeliveryAttemptReportDto,
  ) {
    return this.delivery.reportDeliveryAttempt(deliveryId, report);
  }

  // manager only access
  @Post(':id/receive-return')
  receiveReturnedDelivery(
    @Param('id', { schema: z.uuid() }) deliveryId: string,
  ) {
    return this.delivery.receiveReturnedDelivery(deliveryId);
  }
}
