import { type AuthenticatedUser } from '@feature/authentication-api';
import { AuthenticationGuard, User } from '@feature/authentication-nest';
import { CheckPolicies, PoliciesGuard } from '@feature/authorization-nest';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { recordOrderSchema, type RecordOrderType } from './order.schema';
import { OrderService } from './order.service';
import { CancelOrderPolicy } from './policies/cancel-order-policy.handler';
import { OrderAbilityFactory } from './policy/order-ability';
import { ReadOrderPolicy } from './policy/read-order-policy.handler';
import { RecordOrderPolicy } from './policy/record-order-policy.handler';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /*
   * [NOTE]
   * Register the ability factory and policy handlers as providers.
   * PoliciesGuard resolves them through ModuleRef.
   *
   * AuthenticationGuard and PoliciesGuard do not need to be registered
   * as providers in the feature module. They are provided globally by the
   * application container and can be resolved by NestJS when used with
   * @UseGuards().
   *
   * The feature module only needs to register its ability factory and policy
   * handlers, which are resolved dynamically by PoliciesGuard through ModuleRef.
   */
  @UseGuards(AuthenticationGuard, PoliciesGuard)
  @CheckPolicies({ abilityFactory: OrderAbilityFactory, handlers: [ReadOrderPolicy] })
  @Get(':id')
  order(@Param('id', { schema: z.object({}) }) orderId: string) {
    return this.orderService.findById({ orderId }).then(({ order }) => order);
  }

  @UseGuards(AuthenticationGuard, PoliciesGuard)
  @CheckPolicies({ abilityFactory: OrderAbilityFactory, handlers: [RecordOrderPolicy] })
  @Post()
  record(
    @Body({ schema: recordOrderSchema }) body: RecordOrderType,
    @User() user: Extract<AuthenticatedUser, { role: 'customer' }>,
  ) {
    return this.orderService.recordOrder({
      customerId: user.customer.id,
      items: body.items,
      recipient: body.recipient,
    });
  }

  @UseGuards(AuthenticationGuard, PoliciesGuard)
  @CheckPolicies({ abilityFactory: OrderAbilityFactory, handlers: [CancelOrderPolicy] })
  @Post(':id')
  cancel(@Param('id', { schema: z.uuid() }) orderId: string) {
    return this.orderService.cancelOrder({ orderId });
  }
}
