import {
  InboundMovementSource,
  IssueMovementSource,
  MovementItem,
  ReceiptMovementSource,
  ReturnMovementItem,
  ReturnMovementSource,
  StockMovementApi,
} from '@feature/warehouse-api';
import { DrizzleTransactionContext } from '@infra/db-drizzle';
import { Injectable } from '@nestjs/common';
import { Outbox } from '@nestjs/outbox';
import { StockQuarantineService } from './quarantine.service';
import { StockMovementRepository } from './repositories/movement.repository';
import { StockService } from './stock.service';

export type AdjustMovementSource = Extract<
  InboundMovementSource['source'],
  { type: 'adjustment' }
>;

@Injectable()
export class StockMovementService implements StockMovementApi {
  constructor(
    private readonly stock: StockService,
    private readonly quarantine: StockQuarantineService,
    private readonly tx: DrizzleTransactionContext,
    private readonly repository: StockMovementRepository,
    private readonly outbox: Outbox,
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
          source: {
            direction: 'outbound',
            ...source,
          },
        });

        await this.outbox.add(this.tx.current, {
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
          source: {
            direction: 'inbound',
            ...source,
          },
        });

        await this.outbox.add(this.tx.current, {
          topic: 'warehouse.stocks-receipted',
          payload: {},
        });

        return { movementId };
      }),
    );
  }

  return(
    items: ReturnMovementItem[],
    source: ReturnMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }> {
    return this.tx.run(async () =>
      this.repository.withLock('return', idempotencyKey, async () => {
        const key = `return:${idempotencyKey}`;

        const existing = await this.repository.findByIdempotencyKey(key);
        if (existing) return { movementId: existing.id };

        const sealed = items.filter((i) => i.packaging === 'sealed');
        const opened = items.filter((i) => i.packaging === 'opened');

        const restocked = this.groupCount(sealed);

        await this.stock.increase(restocked);

        const { movementId } = await this.repository.record({
          idempotencyKey: key,
          items: restocked,
          source: {
            direction: 'inbound',
            ...source,
          },
        });

        await this.quarantine.quarantineMany(
          opened.map((i) => ({
            stockId: i.stockId,
            reason: i.reason,
            note: i.note,
            movementId,
          })),
        );

        await this.outbox.add(this.tx.current!, {
          topic: 'warehouse.stocks-returned',
          payload: {
            movementId,
            restocked,
            quarantined: this.groupCount(opened),
          },
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
          source: {
            direction,
            ...source,
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

  undo(movementId: string): Promise<void> {
    return this.tx.run(async () =>
      this.repository.withForUpdate(async () => {
        const movement = await this.repository.findById(movementId);
        if (!movement) {
          throw new Error(`Movement ${movementId} not found`);
        }

        await this.applyInverse(movement);

        await this.repository.delete(movementId);

        await this.outbox.add(this.tx.current, {
          topic: 'warehouse.movement-undone',
          payload: {
            movementId,
            items: movement.items,
          },
        });
      }),
    );
  }

  private async applyInverse(
    movement: Awaited<ReturnType<typeof this.repository.findById>>,
  ): Promise<void> {
    const { source, items } = movement;

    switch (source.type) {
      case 'sales':
        await this.stock.increase(items);
        break;

      case 'procurement':
        await this.stock.decrease(items);
        break;

      case 'adjustment':
        await (source.direction === 'inbound'
          ? this.stock.decrease(items)
          : this.stock.increase(items));
        break;

      case 'return':
        break;

      default:
        return assertNever(source); // compile error if a new type is added
    }
  }

  private groupCount(units: { stockId: string }[]) {
    return [
      ...units.reduce(
        (m, u) => m.set(u.stockId, (m.get(u.stockId) ?? 0) + 1),
        new Map<string, number>(),
      ),
    ]
      .map(([stockId, quantity]) => ({ stockId, quantity }))
      .sort((a, b) => a.stockId.localeCompare(b.stockId));
  }
}

function assertNever(x: never): never {
  throw new Error(`Unhandled movement type: ${JSON.stringify(x)}`);
}
