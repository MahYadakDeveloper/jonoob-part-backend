import { UnpricedInvoiceItem } from "@feature/pricing-api";
import { ProductProjection } from "model/product-projection";

export function mapProductToUnpricedInvoiceItem(
  product: ProductProjection,
  quantity = 1,
): UnpricedInvoiceItem {
  if (product.kind === "product") {
    return {
      kind: "product",
      productId: product.id,
      description: product.description,
      quantity,
    };
  }

  return {
    kind: "bundle",
    productId: product.id,
    description: product.description,
    quantity,
    items: product.items.map((bundleItem) => ({
      kind: "product",
      productId: bundleItem.product.id,
      description: bundleItem.product.description,
      quantity: bundleItem.quantity,
    })),
  };
}
