import { EntityId } from "@feature/shared";
export class ProductId extends EntityId {
  private constructor(value: string) {
    super(value);
  }

  public static create(value: string) {
    return new ProductId(value);
  }
}
