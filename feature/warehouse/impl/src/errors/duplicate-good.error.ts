export class DuplicateGoodError extends Error {
  constructor(public readonly goodId: string) {
    super(`Duplicate good detected: "${goodId}".`);

    this.name = DuplicateGoodError.name;
  }
}
