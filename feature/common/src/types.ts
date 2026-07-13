import { Money } from "./model/money";

export type UnitOfMeasure = "piece" | "pair" | "set";

export type CustomerType = "merchant" | "consumer" | "technician";

export type ProductLeafKind = { kind: "product" };
export type ProductBundleKind = { kind: "bundle" };
export type ProductKind = ProductBundleKind | ProductLeafKind;
