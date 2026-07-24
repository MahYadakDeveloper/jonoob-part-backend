import { Barcode, UnitOfMeasure } from "@feature/common";

export type Good = {
  readonly id: string;
  readonly barcode: Barcode;
  readonly stock: number;
  readonly unitOfMeasure?: UnitOfMeasure;
  readonly storageLocation?: string;
};

export type GoodDetails = Omit<Good, "stock">;
