import { CheckPolicies } from '@feature/shared/decorators/check-policies.decorator';
import { Body, Controller, Param, Patch } from '@nestjs/common';
import { z } from 'zod';

@Controller()
export class MovementController {
  constructor(private readonly adjustMovement: AdjustMovementCommend) {}
  @CheckPolicies({
    abilityFactory: StockAbilityFactory,
    handlers: [StockManagementPolicyHandler],
  })
  @Patch(':id')
  adjust(
    @Param({ schema: z.uuid() }) stockId: string,
    @Body({ schema: StockAdjustmentSchema })
    { quantity, ...rest }: StockAdjustmentDto,
  ) {
    this.movements.adjust({ ...rest, item: { stockId, quantity } });
  }
}
