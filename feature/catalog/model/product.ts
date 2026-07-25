import { LineItems, Money, UnitOfMeasure } from "@feature/common";

export type EnrichedData = {
  price: Money;
  stock: number;
  unitOfMeasure?: UnitOfMeasure;
  storageLocation?: string;
};

/**
 * Generated search projection for Elasticsearch indexing.
 */
type SearchText = string[];

export type ProductReferences = {
  brandId?: string;
  categoryIds: string[]; // (taxonomy) `CategoryNode` referenced
  fitmentIds: string[];
};

export type ProductRaw = LeafProductRaw | BundleProductRaw;
export type Product = ProductRaw & {
  displayName: string; // this is generated base on technical
  canonicalName: string; // model-[...variants], we do not doing search base on this

  /**
   * Human-defined alternative names.
   * Used as semantic synonyms.
   */
  aliases: string[];

  emplacement?: string;
  quality?: "oe" | "oem" | "aftermarket";

  enriched?: EnrichedData;
  references: ProductReferences;
};

export type SelectKeys<T, S extends Partial<Record<keyof T, boolean>>> = {
  [K in keyof S]: S[K] extends true ? K : never;
}[keyof S] &
  keyof T;

export type Selected<T, S extends Partial<Record<keyof T, boolean>>> = Pick<
  T,
  SelectKeys<T, S>
>;

export type PopulatedProduct<
  S extends Partial<Record<keyof PopulatedData, boolean>>,
> = ProductRaw & {
  populated: Selected<PopulatedData, S>;
};

export type LeafProductRaw = {
  id: string;
  kind: "leaf";
  goodId: string;
};

export type BundleProductRaw = {
  id: string;
  kind: "bundle";
  items: LineItems<BundleItem>;
};

export type BundleItem = {
  productId: string;
  goodId: string;
  quantity: number;
};
