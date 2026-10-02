import {
  InboundMovementSource,
  IssueMovementSource,
  MovementItem,
  OutboundMovementSource,
  ReceiptMovementSource,
  ReturnMovementSource,
  StockMovementApi,
} from '@feature/warehouse-api';
import { DbTransaction, DrizzleTransactionContext } from '@infra/db-drizzle';
import { Injectable } from '@nestjs/common';
import { Outbox } from '@nestjs/outbox';
import { StockMovementRepository } from './repositories/stock-movement.repository';
import { StockService } from './stock.service';

export type AdjustMovementSource = Extract<
  (InboundMovementSource | OutboundMovementSource)['source'],
  { type: 'adjustment' }
>;

@Injectable()
export class StockMovementService implements StockMovementApi {
  constructor(
    private readonly stock: StockService,
    private readonly tx: DrizzleTransactionContext,
    private readonly repository: StockMovementRepository,
    private readonly outbox: Outbox<DbTransaction>,
  ) {}

  issue(
    items: MovementItem[],
    source: IssueMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }> {
    return this.tx.run(async () =>
      this.repository.withLock('issue', idempotencyKey, async () => {
        const key = `issue:${idempotencyKey}`;

        const movement = await this.repository.findByIdempotencyKey(key);

        if (movement)
          return {
            movementId: movement.id,
          };

        await this.stock.decrease(items);

        const { movementId } = await this.repository.record({
          idempotencyKey: key,
          items,
          details: {
            direction: 'outbound',
            source,
          },
        });

        await this.outbox.add(this.tx.current!, {
          topic: 'warehouse.stocks-issued',
          payload: {},
        });

        return { movementId };
      }),
    );
  }

  receipt(
    items: MovementItem[],
    source: ReceiptMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }> {
    return this.tx.run(async () =>
      this.repository.withLock('receipt', idempotencyKey, async () => {
        const key = `receipt:${idempotencyKey}`;

        const movement = await this.repository.findByIdempotencyKey(key);

        if (movement)
          return {
            movementId: movement.id,
          };

        await this.stock.increase(items);

        const { movementId } = await this.repository.record({
          idempotencyKey: key,
          items,
          details: {
            direction: 'inbound',
            source,
          },
        });

        await this.outbox.add(this.tx.current!, {
          topic: 'warehouse.stocks-receipted',
          payload: {},
        });

        return { movementId };
      }),
    );
  }

  return(
    items: MovementItem[],
    source: ReturnMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }> {
    return this.tx.run(async () =>
      this.repository.withLock('return', idempotencyKey, async () => {
        const key = `return:${idempotencyKey}`;

        const movement = await this.repository.findByIdempotencyKey(key);

        if (movement)
          return {
            movementId: movement.id,
          };

        await this.stock.increase(items);

        const { movementId } = await this.repository.record({
          idempotencyKey: key,
          items,
          details: {
            direction: 'inbound',
            source,
          },
        });

        await this.outbox.add(this.tx.current!, {
          topic: 'warehouse.stocks-returned',
          payload: {},
        });

        return { movementId };
      }),
    );
  }

  adjust(
    item: MovementItem,
    direction: 'inbound' | 'outbound',
    source: AdjustMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }> {
    return this.tx.run(async () =>
      this.repository.withLock('adjustment', idempotencyKey, async () => {
        const key = `adjustment:${idempotencyKey}`;

        const movement = await this.repository.findByIdempotencyKey(key);

        if (movement)
          return {
            movementId: movement.id,
          };

        switch (direction) {
          case 'inbound':
            await this.stock.increase([item]);
            break;
          case 'outbound':
            await this.stock.decrease([item]);
            break;
        }

        const { movementId } = await this.repository.record({
          idempotencyKey: key,
          items: [item],
          details: {
            direction,
            source,
          },
        });

        await this.outbox.add(this.tx.current!, {
          topic: 'warehouse.stocks-adjusted',
          payload: {},
        });

        return { movementId };
      }),
    );
  }

  async reverse(
    movementId: string,
    idempotencyKey: string,
  ): Promise<{ reversalMovementId: string }> {
    return this.tx.run(async () =>
      this.repository.withLock('reversal', movementId, async () => {
        const key = `reversal:${idempotencyKey}`;

        const done = await this.repository.findByIdempotencyKey(key);
        if (done) return { reversalMovementId: done.id };

        const alreadyReversed =
          await this.repository.findByReversesId(movementId);
        if (alreadyReversed) {
          throw new Error(`Movement ${movementId} is already reversed`);
        }

        const movement = await this.repository.findById(movementId);
        if (!movement) {
          throw new Error(`Movement ${movementId} not found`);
        }

        if (movement.reversesId) {
          throw new Error('A reversal cannot be reversed');
        }

        const { details } = movement;

        if (
          details.source.type !== 'procurement' &&
          details.source.type !== 'sales'
        ) {
          throw new Error(
            `Movements of type "${details.source.type}" cannot be reversed`,
          );
        }

        let reversalDetails:
          | ({ direction: 'inbound' } & InboundMovementSource)
          | ({ direction: 'outbound' } & OutboundMovementSource);

        if (details.direction === 'inbound') {
          if (details.source.type !== 'procurement') {
            throw new Error('Unexpected inbound source');
          }
          await this.stock.decrease(movement.items);

          reversalDetails = {
            direction: 'outbound',
            source: {
              type: 'reversal',
              boundary: 'supply',
            },
          };
        } else {
          if (details.source.type !== 'sales') {
            throw new Error('Unexpected outbound source');
          }
          await this.stock.increase(movement.items);

          reversalDetails = {
            direction: 'inbound',
            source: {
              type: 'reversal',
              boundary: details.source.boundary,
            },
          };
        }

        const { movementId: reversalMovementId } = await this.repository.record(
          {
            idempotencyKey: key,
            items: movement.items,
            details: reversalDetails,
            reversesId: movement.id,
          },
        );

        await this.outbox.add(this.tx.current!, {
          topic: 'warehouse.stocks-adjusted',
          payload: {
            movementId: reversalMovementId,
            reversesId: movement.id,
            items: movement.items,
          },
        });

        return { reversalMovementId };
      }),
    );
  }
}
