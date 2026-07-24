import { LineItems, Money, UnitOfMeasure } from "@feature/common";

export type EnrichedData = {
  price: Money;
  stock: number;
  unitOfMeasure?: UnitOfMeasure;
  storageLocation?: string;
};

export type PopulatedData = {
  displayName: string; // this is generated base on technical
  canonicalName: string; // model-[...variants], we do not doing search base on this

  /**
   * Human-defined alternative names.
   * Used as semantic synonyms.
   */
  aliases: string[];

  /**
   * Generated search projection for Elasticsearch indexing.
   */
  searchText: string[];
  brandId: string;
  categoryIds: string[]; // (taxonomy) `CategoryNode` referenced
  fitmentIds: string;
  emplacement?;
};

export type ProductRaw = LeafProductRaw | BundleProductRaw;
export type Product = ProductRaw & {
  enriched?: EnrichedData;
  populated: PopulatedData;
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
