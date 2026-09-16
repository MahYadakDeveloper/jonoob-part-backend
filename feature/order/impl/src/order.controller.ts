import { AuthenticationGuard } from '@feature/authentication-nest';
import { CheckPolicies, PoliciesGuard } from '@feature/authorization-nest';
import { Controller, Post, UseGuards } from '@nestjs/common';
import { OrderAbilityFactory } from './authorization/order-ability';
import { ReadOrderPolicy } from './authorization/read-order-policy.handler';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /*
   * NOTE: Register the ability factory and policy handlers as providers.
   * PoliciesGuard resolves them through ModuleRef.
   **/
  @UseGuards(AuthenticationGuard, PoliciesGuard)
  @CheckPolicies({ abilityFactory: OrderAbilityFactory, handlers: [ReadOrderPolicy] })
  async order(/*...*/) {}

  @Post()
  record() {}
}
