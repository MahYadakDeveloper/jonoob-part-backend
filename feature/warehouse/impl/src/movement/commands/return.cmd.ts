import { ApiCommand } from '@feature/shared/command';
import { MovementApi } from '@feature/warehouse-api/';
import { DrizzleTransactionContext } from '@infra/db-drizzle';
import { Injectable } from '@nestjs/common';
import { StockRepository } from '../../stock.repository';
import { MovementRepository } from '../movement.repository';
import { MovementApiIn, MovementApiOut } from './movement.commands';

@Injectable()
export class ReturnMovementCommand implements ApiCommand<
  MovementApi,
  'return'
> {
  constructor(
    private readonly movements: MovementRepository,
    private readonly stocks: StockRepository,
  ) {}

  async execute(
    input: MovementApiIn<'return'>,
  ): Promise<MovementApiOut<'return'>> {
    return this.movements.transaction(async () => {
      const {
        true: toBeQuarantinedInput = [],
        false: toBeRestockedInput = [],
      } = Object.groupBy(input.items, (s) => String(s.quarantine)) as {
        true?: Extract<(typeof input.items)[number], { quarantine: true }>[];
        false?: Extract<(typeof input.items)[number], { quarantine: false }>[];
      };

      const toBeRestocked = [
        ...toBeRestockedInput
          .map(({ quarantine, ...s }) => ({ ...s, quantity: 0 }))
          .toMap('stockId', (a, b) => ({
            ...a,
            quantity: a.quantity + b.quantity,
          }))
          .values(),
      ];

      await this.stocks.increase(toBeRestocked);

      const { items, ...m } = input;
      const { movementId } = await this.movements.record({
        ...m,
        items: toBeRestocked,
        direction: 'inbound',
      });

      const toBeQuarantined = toBeQuarantinedInput.map(
        ({ quarantine, ...q }) => ({ ...q, movementId }),
      );
      await this.movements.quarantine(toBeQuarantined);

      return { movementId };
    });
  }
}
