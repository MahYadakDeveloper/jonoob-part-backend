import { ApiCommand, ApiInput, ApiOutput } from '@feature/shared/command';
import { MovementApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { StockRepository } from '../../stock.repository';
import { MovementRepository } from '../movement.repository';

@Injectable()
export class ReceiptMovementCommand implements ApiCommand<
  MovementApi,
  'receipt'
> {
  constructor(
    private readonly movements: MovementRepository,
    private readonly stocks: StockRepository,
  ) {}

  async execute(
    input: ApiInput<MovementApi, 'receipt'>,
  ): Promise<ApiOutput<MovementApi, 'receipt'>> {
    return this.movements.transaction(async () => {
      await this.stocks.increase(input.items);

      const { movementId } = await this.movements.record({
        ...input,
        direction: 'inbound',
      });

      return {
        movementId,
      };
    });
  }
}
