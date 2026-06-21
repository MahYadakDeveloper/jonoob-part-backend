import { Money } from "./money";

export class Price implements Record<string, Money> {
  [x: string]: Money;
}
