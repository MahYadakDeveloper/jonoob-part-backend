import { Barcode, UnitOfMeasure } from "@feature/common";

export class Good {
  constructor(
    readonly id: string,
    readonly barcode: Barcode,
    readonly stock: number,
    readonly unitOfMeasure?: UnitOfMeasure,
    readonly storageLocation?: string,
  ) {}
}
