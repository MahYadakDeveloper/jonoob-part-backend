import { DuplicateLineItemError } from "../errors/duplicate-line-item.error";
import { LineItems } from "../model/line-items";

declare global {
  interface ReadonlyArray<T> {
    toLineItems(keySelector: (item: T) => string): LineItems<T>;
  }
  interface Array<T> {
    toLineItems(keySelector: (item: T) => string): LineItems<T>;
  }
}

Array.prototype.toLineItems = function <T>(
  this: readonly T[],
  keySelector: (item: T) => string,
): LineItems<T> {
  return new LineItems<T>(keySelector, this);
};

export {};
