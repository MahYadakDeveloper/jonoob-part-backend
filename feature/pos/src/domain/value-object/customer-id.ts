import { EntityId } from "@feature/shared";

export class CustomerId extends EntityId {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string) {
    return new CustomerId(value);
  }
}
