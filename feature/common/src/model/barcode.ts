import { z } from "zod";

type BarcodeType =
  | "UPC_A"
  | "UPC_E"
  | "EAN_13"
  | "EAN_8"
  | "Code39"
  | "Code93"
  | "Code128"
  | "Codebar";

const BarcodeSchemas: Record<BarcodeType, z.ZodType<string>> = {
  UPC_A: z.string().regex(/^\d{12}$/),
  UPC_E: z.string().regex(/^\d{8}$/),
  EAN_13: z.string().regex(/^\d{13}$/),
  EAN_8: z.string().regex(/^\d{8}$/),
  Code39: z.string().regex(/^[0-9A-Z\-.\ $/+%]+$/),
  Code93: z.string().min(1),
  Code128: z.string().min(1),
  Codebar: z.string().regex(/^[A-D][0-9\-\$:/.+]+[A-D]$/),
};

export class Barcode {
  private constructor(
    readonly value: string,
    readonly type: BarcodeType,
  ) {}

  static create(value: string, type: BarcodeType) {
    BarcodeSchemas[type].parse(value);
    return new Barcode(value, type);
  }
}
