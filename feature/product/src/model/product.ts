export type Product = ProductLeaf | ProductBundle;

export type ProductLeaf = ProductLeafKind & {
  id: string;
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

export type ProductBundle = ProductBundleKind & {
  id: string;
  kind: "bundle";
  items: BundleItem[];
};

export type BundleItem = {
  product: Product;
  quantity: number;
};
