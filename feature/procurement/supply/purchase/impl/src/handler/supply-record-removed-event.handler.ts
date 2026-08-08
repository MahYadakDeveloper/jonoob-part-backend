import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import {
  SupplyRecordEventPayload,
  SupplyRecordRemovedEventType,
} from '@feature/procurement-supply-api';
import {
  ManyPurchaseRecordEventPayload,
  ManyPurchaseRecordEventType,
} from '@feature/procurement-supply-purchase-api';
import { Injectable } from '@nestjs/common';
import { type PurchaseRecordRepository } from '../purchase-record.repository';

@Injectable()
export class SupplyRecordRemovedEventHandler extends BaseEventHandler<SupplyRecordEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: PurchaseRecordRepository,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {
    super(registry, SupplyRecordRemovedEventType);
  }
  async handle(payload: SupplyRecordEventPayload): Promise<void> {
    await this.tx.run(async () => {
      await this.repository.deleteManyByDocumentId(payload.documentId);

      await this.outbox.save({
        type: ManyPurchaseRecordEventType,
        payload: {
          goodIds: payload.lines.toArray().map((item) => item.goodId),
        } satisfies ManyPurchaseRecordEventPayload,
      });
    });
  }
}
