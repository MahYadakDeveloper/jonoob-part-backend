import { EntityId } from "@feature/shared";

export class GoodId extends EntityId {
  static create(id: string) {
    return new GoodId(id);
  }

  private constructor(id: string) {
    super(id);
  }
}
