import { BaseEventHandler, EventHandlerRegistry } from '@feature/common';
import {
  SupplyRecordedEventPayload,
  SupplyRecordedEventType,
} from '@feature/procurement-supply-api';
import { PurchaseRecordRepository } from '../purchase-record.repository';

// [TODO] Complete this handler
export class SupplyRecordedEventHandler extends BaseEventHandler<SupplyRecordedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: PurchaseRecordRepository,
  ) {
    super(registry, SupplyRecordedEventType);
  }
  async handle(payload: SupplyRecordedEventPayload): Promise<void> {
    // [TODO] Dispatch event
    const ids = await this.repository.createMany(
      payload.lines.transform(
        (item) => ({
          specialistId: payload.specialistId,
          goodId: item.goodId,
          supplier: payload.supplier,
          purchasePrice: item.purchasePrice,
          type: 'supply' as const,
          recordedAt: new Date(),
        }),
        (item) => item.goodId,
      ),
    );
  }
}
