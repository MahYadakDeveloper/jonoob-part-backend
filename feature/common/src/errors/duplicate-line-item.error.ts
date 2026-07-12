export class DuplicateLineItemError extends Error {
  readonly code = "DUPLICATE_LINE_ITEM";

  constructor(public readonly itemId: string) {
    super(`Line item with id "${itemId}" already exists.`);

    this.name = DuplicateLineItemError.name;

    Object.setPrototypeOf(this, DuplicateLineItemError.prototype);
  }
}