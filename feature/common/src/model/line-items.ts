import { LineItemNotFoundError } from "../errors/line-item-not-found.error";

export class LineItems<T> implements Iterable<T> {
  private readonly items = new Map<string, T>();

  constructor(
    private readonly keySelector: (item: T) => string,
    items?: readonly T[],
  ) {
    items?.forEach((item) => this.set(item));
  }

  set(item: T): this {
    this.items.set(this.keySelector(item), item);

    return this;
  }

  setMany(items: readonly T[]): this {
    for (const item of items) {
      this.set(item);
    }

    return this;
  }

  get(key: string): T | undefined {
    return this.items.get(key);
  }

  getOrThrow(key: string): T {
    const item = this.items.get(key);

    if (!item) {
      throw new LineItemNotFoundError(key);
    }

    return item;
  }

  has(key: string): boolean {
    return this.items.has(key);
  }

  transform<U>(fn: (item: T) => U, keySelector: (item: U) => string): LineItems<U> {
    const result = new LineItems<U>(keySelector);

    for (const item of this) {
      result.set(fn(item));
    }

    return result;
  }

  delete(key: string): boolean {
    return this.items.delete(key);
  }

  clear(): void {
    this.items.clear();
  }

  get size(): number {
    return this.items.size;
  }

  keys(): IterableIterator<string> {
    return this.items.keys();
  }

  values(): IterableIterator<T> {
    return this.items.values();
  }

  entries(): IterableIterator<[string, T]> {
    return this.items.entries();
  }

  forEach(callback: (item: T, key: string) => void): void {
    this.items.forEach((item, key) => {
      callback(item, key);
    });
  }

  toArray(): readonly T[] {
    return [...this.items.values()];
  }

  [Symbol.iterator](): Iterator<T> {
    return this.items.values();
  }
}
