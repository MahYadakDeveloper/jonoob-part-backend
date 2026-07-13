import { InvoiceItem, LineItems, ProductInvoiceItem } from "@feature/common";

export function flattenInvoiceItem(
  item: InvoiceItem,
): readonly ProductInvoiceItem[] {
  if (item.kind === "product") {
    return [item];
  }

  return item.items.map((bundleItem) => ({
    kind: "product",
    productId: bundleItem.productId,
    description: bundleItem.description,
    quantity: bundleItem.quantity * item.quantity,
    unitPrice: bundleItem.unitPrice,
    lineTotal: bundleItem.lineTotal,
  }));
}

export function flattenInvoiceItems(
  items: LineItems<InvoiceItem>,
): LineItems<ProductInvoiceItem> {
  const result = new LineItems<ProductInvoiceItem>((p) => p.productId);

  for (const item of items) {
    if (item.kind === "product") {
      result.set(item);
      continue;
    }

    for (const bundleItem of item.items) {
      const quantity = bundleItem.quantity * item.quantity;

      const existing = result.get(item.productId);

      if (existing) {
        result.set({
          ...existing,
          quantity: existing.quantity + quantity,
        });
      } else {
        result.set({
          kind: "product",
          productId: bundleItem.productId,
          description: bundleItem.description,
          quantity,
          unitPrice: bundleItem.unitPrice,
          lineTotal: bundleItem.lineTotal,
        });
      }
    }
  }

  return result;
}
