import * as z from 'zod'
export class Money {
  private constructor(private readonly value: number) {}

  public static create(value: number) {
    z.number().gte(0).parse(value)
    return new Money(value);
  }

}
