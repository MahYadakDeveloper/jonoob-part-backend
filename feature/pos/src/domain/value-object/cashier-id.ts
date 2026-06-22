import { EntityId } from "@feature/shared";

export class CashierId extends EntityId {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string) {
    return new CashierId(value);
  }
}
