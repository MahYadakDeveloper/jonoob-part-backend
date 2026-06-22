import { z } from "zod";

export class Markup {
  private constructor(readonly value: number) {}

  static create(value: number) {
    z.number().gte(0).parse(value);
    return new Markup(value);
  }
}
