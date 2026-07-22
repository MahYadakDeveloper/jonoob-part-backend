import { LineItems, UnitOfMeasure } from "@feature/common";

export type ProductDefinition = {
  enriched?: {
    price: {
      value: number;
      unit: "toman" | "rial";
    };
    stock: number;
    unitOfMeasure?: UnitOfMeasure;
    storageLocation?: string
  };
  populated?: {
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
};

export type ProductBase = {
  id: string;
  definition: ProductDefinition;
};

export type Product = ProductBase & {
  goodId: string;
  kind: "leaf";
};

export type ProductBundle = ProductBase & {
  id: string;
  kind: "bundle";
  items: LineItems<BundleItem>;
};

export type BundleItem = {
  productId: string;
  quantity: number;
};
