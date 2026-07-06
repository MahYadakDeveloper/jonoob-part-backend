import { GoodsIssuedEvent, GoodsReceiptedEvent } from "@feature/warehouse-api";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class Replenishment {
  constructor() {}
  /**
   * Event tokens follow the `<feature>.<event>` convention.
   *
   * The feature name is used as-is, while the event class name is converted
   * from PascalCase to kebab-case and the `Event` suffix is removed.
   *
   * Example:
   *   Warehouse + GoodsIssuedEvent -> "warehouse.goods-issued"
   */
  @OnEvent("warehouse.goods-issued")
  handleGoodsIssuedEvent(event: GoodsIssuedEvent) {}

  @OnEvent("warehouse.goods-receipted")
  handleGoodsReceiptedEvent(event: GoodsReceiptedEvent) {}
}
