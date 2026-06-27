export class Percentage {
  private constructor(private readonly value: number) {}

  static create(value: number) {
    return new Percentage(value);
  }
}
