import { UnitOfMeasure } from "./types";

export type ProductKind = "product" | "bundle";

type Product = ProductLeaf | ProductBundle;

type ProductLeaf = {
  id: string;
  kind: Extract<ProductKind, "product">;
  definition: {
    enriched?: {
      price: {
        value: number;
        unit: "toman" | "rial";
      };
      stock: number;
      unitOfMeasure: UnitOfMeasure;
      // ...
    };
    populated?: {
      /* ... */
    };
  };
};

type ProductBundle = {
  id: string;
  kind: "bundle";
  items: BundleItem[];
};

type BundleItem = {
  product: Product;
  qty: number;
};
