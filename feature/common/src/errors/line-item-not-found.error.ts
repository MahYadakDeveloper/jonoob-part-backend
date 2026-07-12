export class LineItemNotFoundError extends Error {
  readonly code = "LINE_ITEM_NOT_FOUND";

  constructor(public readonly key: string) {
    super(`Line item with key "${key}" was not found.`);

    this.name = LineItemNotFoundError.name;

    Object.setPrototypeOf(this, LineItemNotFoundError.prototype);
  }
}
