import { EntityId } from "@feature/shared";
import { Item } from "domain/value-object/item";

/**
 * NOTE: note that we may need discount service for applying discount only once
 * on item and don't forgot about rewardService to
 */
export class SaleInvoice {
  private constructor(
    private readonly cashierId: EntityId,
    private _items: Item[],
    private customerId?: EntityId,
  ) {}
}
