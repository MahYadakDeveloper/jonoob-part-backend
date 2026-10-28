import { type Manager } from '@feature/authentication-http';
import { CurrentUser } from '@feature/authentication-http/decorators';
import { CheckPolicies } from '@feature/authorization-http/decorators';
import { PoliciesGuard } from '@feature/authorization-http/guards';
import { ProblemResponses } from '@feature/error-http/decorators';
import { StockNotFoundError } from '@feature/warehouse-errors/stock';
import { Body, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdjustCommand } from './commands/adjust.command';
import { type AdjustDto, adjustDtoSchema } from './dto/adjust.dto';
import { MovementAbilityFactor } from './policies/movement-ability.factory';
import { MovementManagementPolicy } from './policies/movement-management-policy.handler';
import { ListQuery } from './queries/list.query';
import { type ListQueryDto, listQuerySchema } from './dto/list-query.dto';

@UseGuards(PoliciesGuard)
@CheckPolicies({
  abilityFactory: MovementAbilityFactor,
  handlers: [MovementManagementPolicy],
})
@Controller('warehouse/movement')
export class MovementController {
  constructor(
    private readonly listQuery: ListQuery,
    private readonly adjustCmd: AdjustCommand,
  ) {}

  @Get()
  list(@Query({ schema: listQuerySchema }) q: ListQueryDto) {
    return this.listQuery.execute(q);
  }

  /**
   * If the error is not inherited from category errors then mapping domain
   * error is required
   */
  @ProblemResponses(StockNotFoundError)
  adjust(
    @Body({ schema: adjustDtoSchema }) dto: AdjustDto,
    @CurrentUser() manager: Manager,
  ) {
    return this.adjustCmd.execute({ ...dto, managerId: manager.id });
  }
}
