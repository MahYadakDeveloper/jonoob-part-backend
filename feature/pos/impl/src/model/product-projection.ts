import { ProductBundleKind, ProductLeafKind } from "@feature/common";

export type ProductProjectionBase = {
  readonly id: string;
  readonly description: string;
};

export type ProductLeafProjection = ProductProjectionBase & ProductLeafKind;

export type ProductBundleProjection = ProductProjectionBase &
  ProductBundleKind & {
    readonly items: readonly {
      readonly product: ProductLeafProjection;
      readonly quantity: number;
    }[];
  };

export type ProductProjection = ProductLeafProjection | ProductBundleProjection;
