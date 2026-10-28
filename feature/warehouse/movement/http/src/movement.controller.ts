import { type Manager } from '@feature/authentication-http';
import { CurrentUser } from '@feature/authentication-http/decorators';
import { CheckPolicies } from '@feature/authorization-http/decorators';
import { PoliciesGuard } from '@feature/authorization-http/guards';
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { movementHttpErrors } from './movement.errors';
import { MovementAbilityFactor } from './policies/movement-ability.factory';
import { MovementManagementPolicy } from './policies/movement-management-policy.handler';
import {
  ListQuery,
  listQuerySchema,
  type ListQueryDto,
} from './queries/list.query';

// export class StockNotFoundError extends EntityNotFoundError {
//   static readonly entity = 'Stock';
// }

// export class InsufficientStockError extends ConflictError {
//   constructor(readonly sku: string, readonly requested: number, readonly available: number) {
//     super(`Insufficient stock for ${sku}: requested ${requested}, available ${available}`);
//   }
// }

// export class StockFrozenError extends BusinessRuleViolationError {}

// export const INSUFFICIENT_STOCK = mapDomainError(
//   InsufficientStockError,
//   HttpStatus.CONFLICT,
//   'Not enough stock to fulfil the request',
//   (e) => ({ sku: e.sku, requested: e.requested, available: e.available }),
// );

@UseGuards(PoliciesGuard)
@CheckPolicies({
  abilityFactory: MovementAbilityFactor,
  handlers: [MovementManagementPolicy],
})
@Controller('warehouse/movement')
export class MovementController {
  constructor(private readonly listQuery: ListQuery) {}

  @ApiDomainErrors(...movementHttpErrors)
  @Get()
  list(@Query({ schema: listQuerySchema }) q: ListQueryDto) {
    return this.listQuery.execute(q);
  }

  adjust(
    @Body({schema: })
    @CurrentUser() manger: Manager,
  ) {
    // return this.commands.adjust();
  }
}
