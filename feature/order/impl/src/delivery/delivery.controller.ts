import { CheckPolicies } from '@feature/shared/decorators/check-policies.decorator';
import { AuthenticationGuard } from '@feature/shared/guards/auth.guard';
import { PoliciesGuard } from '@feature/shared/guards/policies.guard';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import {
  ConfirmPickupSchema,
  DeliveryAttemptReportSchema,
  type ConfirmPickupDto,
  type DeliveryAttemptReportDto,
} from './delivery.schema';
import { DeliveryService } from './delivery.service';
import { ConfirmPickupPolicyHandler } from './policies/confirm-pickup.policy';
import { DeliveryAbilityFactory } from './policies/delivery-ability';
import { ReceiveReturnedDeliveryPolicyHandler } from './policies/receive-returned-delivery.policy';
import { ReportDeliveryAttemptPolicyHandler } from './policies/report-delivery-attempt.policy';

@UseGuards(AuthenticationGuard, PoliciesGuard)
@Controller()
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}
  @Get()
  findAll() {
    return this.delivery.findAll();
  }

  @CheckPolicies({
    abilityFactory: DeliveryAbilityFactory,
    handlers: [ConfirmPickupPolicyHandler],
  })
  @Post(':id/confirm-pickup')
  confirmPickup(
    @Param('id', { schema: z.uuid() }) id: string,
    @Body({ schema: ConfirmPickupSchema }) dto: ConfirmPickupDto,
  ) {
    return this.delivery.confirmPickup(id, dto.courierId);
  }

  @CheckPolicies({
    abilityFactory: DeliveryAbilityFactory,
    handlers: [ReportDeliveryAttemptPolicyHandler],
  })
  @Post(':id/attempts')
  reportDeliveryAttempt(
    @Param('id', { schema: z.uuid() }) deliveryId: string,
    @Body({ schema: DeliveryAttemptReportSchema })
    report: DeliveryAttemptReportDto,
  ) {
    return this.delivery.reportDeliveryAttempt(deliveryId, report);
  }

  @CheckPolicies({
    abilityFactory: DeliveryAbilityFactory,
    handlers: [ReceiveReturnedDeliveryPolicyHandler],
  })
  @Post(':id/receive-return')
  receiveReturnedDelivery(
    @Param('id', { schema: z.uuid() }) deliveryId: string,
  ) {
    return this.delivery.receiveReturnedDelivery(deliveryId);
  }
}
