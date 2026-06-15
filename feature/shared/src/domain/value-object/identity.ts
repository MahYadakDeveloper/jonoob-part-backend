export abstract class EntityId {
  protected constructor(private readonly value: string) {}

  equals(other: EntityId) {
    return other.value === this.value;
  }

  getValue(): string {
    return this.value;
  }

  tostring(): string {
    return this.value;
  }
}
