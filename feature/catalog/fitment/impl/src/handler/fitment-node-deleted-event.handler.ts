import {
  FitmentNodeDeletedEventType,
  FitmentNodeDeletedPayload,
} from '@feature/catalog.fitment.node-api';
import {
  BaseEventHandler,
  EventHandlerRegistry,
  OutboxRepository,
  TransactionManager,
} from '@feature/common';
import { FitmentRepository } from '../repository/fitment.repository';

export class FitmentNodeDeletedEventHandler extends BaseEventHandler<FitmentNodeDeletedPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: FitmentRepository,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {
    super(registry, FitmentNodeDeletedEventType);
  }

  async handle(payload: FitmentNodeDeletedPayload): Promise<void> {
    const fitments = await this.repository.findManyByReferredFitment([
      ...payload.fitmentNodes.keys(),
    ]);

    await this.tx.run(async () => {
      await this.repository.deleteMany([...fitments.keys()]);

      await this.outbox.save({
        type: FitmentNodeDeletedEventType,
        payload: [...fitments.keys()],
      });
    });
  }
}
