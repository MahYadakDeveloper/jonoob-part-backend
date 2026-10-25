import { ApiCommand } from '@feature/shared/command';
import '@feature/shared/extensions';
import { assertMaps } from '@feature/shared/utils/assertions';
import { MovementApi } from '@feature/warehouse-api/';
import { ConflictException, Injectable } from '@nestjs/common';
import { StockRepository } from '../../stock.repository';
import { MovementRepository } from '../movement.repository';
import { MovementApiIn, MovementApiOut } from './movement.commands';

@Injectable()
export class IssueMovementCommand implements ApiCommand<MovementApi, 'issue'> {
  constructor(
    private readonly movements: MovementRepository,
    private readonly stocks: StockRepository,
  ) {}

  async execute(
    input: MovementApiIn<'issue'>,
  ): Promise<MovementApiOut<'issue'>> {
    return await this.movements.transaction(
      async () =>
        await this.movements.withForUpdate<MovementApiOut<'issue'>>(
          async () => {
            const requested = input.items.toMap('stockId', (a, b) => ({
              ...a,
              quantity: a.quantity + b.quantity,
            }));
            const stocks = await this.stocks.findManyStockById([
              ...requested.keys(),
            ]);

            assertMaps(
              requested,
              stocks.toMap('id'),
              (r, s) => r.quantity <= s.quantity,
              () => new ConflictException('Insufficient stock'),
            );

            await this.stocks.decrease(input.items);

            const { movementId } = await this.movements.record({
              ...input,
              direction: 'outbound',
            });

            return {
              movementId,
            };
          },
        ),
    );
  }
}
