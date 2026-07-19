import {
  AppliedDiscount,
  CustomerType,
  InvoiceItem,
  InvoiceSummary,
  LineItems,
  Money,
} from "@feature/common";
import {
  ApplicableCampaignDiscount,
  ApplicableDiscount,
  ApplicableSpecificDiscount,
  type IDiscountService,
} from "@feature/discount-api";
import {
  InvoicePricingRequest,
  InvoicePricingResponse,
  IPricingService,
  ManyProductPricingRequest,
  ManyProductPricingResponse,
  PricingPolicyReq,
  PricingPolicyRes,
  ProductPricingRequest,
  ProductPricingResponse,
  UnpricedBundleInvoiceItem,
  UnpricedProductInvoiceItem,
} from "@feature/pricing-api";
import { Injectable } from "@nestjs/common";
import { ProductNotFoundError } from "./errors/product-not-found-error";
import { PurchasePriceNotFoundError } from "./errors/purchase-price-not-found.error";
import { BundleComponentInvoiceItem } from "./model/bundle-component-invoice-item";
import { type ICustomerQuery } from "./port/customer.query";
import { type IMarkupPolicyProvider } from "./port/markup-policy.provider";
import { Product, type IProductQuery } from "./port/product.query";
import { PurchasePrice, type IPurchaseQuery } from "./port/purchase.query";

@Injectable()
export class PricingService implements IPricingService {
  constructor(
    private readonly markupPolicyProvider: IMarkupPolicyProvider,
    private readonly discountService: IDiscountService,
    private readonly customerQuery: ICustomerQuery,
    private readonly productQuery: IProductQuery,
    private readonly purchaseQuery: IPurchaseQuery,
  ) {}

  private resolvePolicy(customerType: string) {
    return customerType === "merchant" ? "wholesale" : "retail";
  }

  async resolvePricingPolicy({
    customerId,
  }: PricingPolicyReq): Promise<PricingPolicyRes> {
    const customerType = await this.customerQuery.getType(customerId);

    return { policy: this.resolvePolicy(customerType) };
  }

  async priceProduct({
    item,
    policy,
  }: ProductPricingRequest): Promise<ProductPricingResponse> {
    const { prices } = await this.priceManyProduct({
      items: [item].toLineItems((x) => x.productId),
      policy,
    });

    return {
      price: prices.getOrThrow(item.productId).price,
    };
  }

  async priceManyProduct({
    items,
    policy,
  }: ManyProductPricingRequest): Promise<ManyProductPricingResponse> {
    const markup = await this.markupPolicyProvider.resolve(policy);

    // Resolving product
    const products = await this.productQuery.findMany([...items.keys()]);

    for (const productId of items.keys()) {
      if (!products.has(productId)) throw new ProductNotFoundError(productId);
    }

    const leafProductIds = this.collectLeafProductIds(products);

    const leafPurchasePrices =
      await this.purchaseQuery.findMany(leafProductIds);

    const prices = new LineItems<{
      productId: string;
      price: Money;
    }>((item) => item.productId);

    for (const product of products) {
      const price =
        product.kind === "product"
          ? this.calculateUnitPrice(
              leafPurchasePrices.getOrThrow(
                product.id,
                (id) => new PurchasePriceNotFoundError(id),
              ).price,
              markup,
            )
          : product.items.reduce((total, item) => {
              const purchasePrice = leafPurchasePrices.getOrThrow(
                item.id,
                (id) => new PurchasePriceNotFoundError(id),
              ).price;

              return total.add(
                this.calculateUnitPrice(purchasePrice, markup).multiply(
                  item.qty,
                ),
              );
            }, Money.zero());

      prices.set({ productId: product.id, price });
    }

    return { prices };
  }

  async priceInvoice({
    items,
    customerId,
  }: InvoicePricingRequest): Promise<InvoicePricingResponse> {
    // Getting products
    const products = await this.productQuery.findMany([...items.keys()]);
    for (const item of items) {
      if (!products.has(item.productId)) {
        throw new ProductNotFoundError(item.productId);
      }
    }

    // Resolving purchase prices
    const leafProductIds = this.collectLeafProductIds(products);
    const purchasePrices = await this.purchaseQuery.findMany(leafProductIds);

    // Resolving markup
    const customerType: CustomerType = customerId
      ? await this.customerQuery.getType(customerId)
      : "consumer";
    const policy = this.resolvePolicy(customerType);
    const markup = await this.markupPolicyProvider.resolve(policy);

    const discounts = !!customerId
      ? (
          await this.discountService.findManyApplicableDiscount({
            customerId,
            productIds: [...items.keys()],
          })
        ).discounts
      : undefined;

    // Pricing items
    const pricedInvoiceItems = new LineItems<InvoiceItem>((x) => x.productId);
    for (const item of items) {
      const discount = discounts?.get(item.productId)?.discount;

      pricedInvoiceItems.set(
        item.kind === "bundle"
          ? this.priceBundleInvoiceItem(item, purchasePrices, markup, discount)
          : this.priceProductInvoiceItem(
              item,
              purchasePrices,
              markup,
              discount,
            ),
      );
    }

    const summary: InvoiceSummary = pricedInvoiceItems.reduce<InvoiceSummary>(
      (summary, item) => {
        const discount = item.discount
          ? (summary.discount ?? Money.zero()).add(item.discount.totalDiscount)
          : summary.discount;

        return {
          grandTotal: summary.grandTotal.add(item.lineTotal),
          subtotal: summary.subtotal.add(
            item.unitPrice.multiply(item.quantity),
          ),
          discount,
        };
      },
      {
        grandTotal: Money.zero(),
        subtotal: Money.zero(),
      },
    );

    return {
      pricedInvoice: { items: pricedInvoiceItems, summary },
    };
  }

  private priceProductInvoiceItem(
    item: UnpricedProductInvoiceItem,
    purchasePrices: LineItems<PurchasePrice>,
    markup: number,
    discount?: ApplicableDiscount,
  ): InvoiceItem {
    const purchasePrice = purchasePrices.getOrThrow(
      item.productId,
      (id) => new PurchasePriceNotFoundError(id),
    ).price;

    // This may unit price may consist of real price plus fake discount
    const realUnitPrice = this.calculateUnitPrice(purchasePrice, markup);
    const displayUnitPrice = this.calculateDisplayPrice(
      realUnitPrice,
      discount,
    );
    const appliedDiscount = this.applyDiscount(
      displayUnitPrice,
      item.quantity,
      discount,
    );
    const lineTotal = displayUnitPrice
      .multiply(item.quantity)
      .subtract(appliedDiscount?.totalDiscount ?? Money.zero());
    return {
      ...item,
      unitPrice: displayUnitPrice,
      discount: appliedDiscount,
      lineTotal,
    };
  }

  private priceBundleInvoiceItem(
    item: UnpricedBundleInvoiceItem,
    purchasePrices: LineItems<PurchasePrice>,
    markup: number,
    discount?: ApplicableDiscount,
  ): InvoiceItem {
    const pricedBundleItems = new LineItems<BundleComponentInvoiceItem>(
      (x) => x.productId,
    );

    for (const bundleItem of item.items) {
      const purchasePrice = purchasePrices.getOrThrow(
        bundleItem.productId,
        (id) => new PurchasePriceNotFoundError(id),
      ).price;

      const realUnitPrice = this.calculateUnitPrice(purchasePrice, markup);
      const lineTotal = realUnitPrice.multiply(bundleItem.quantity);
      pricedBundleItems.set({
        ...bundleItem,
        unitPrice: realUnitPrice,
        lineTotal,
      });
    }

    // Calculate displayed component prices while preserving bundle displayed price
    const displayPricedBundleItems = !!discount
      ? this.calculateBundleDisplayItems(pricedBundleItems, discount)
      : pricedBundleItems;

    const displayUnitPrice = displayPricedBundleItems.reduce(
      (total, bundleItem) => {
        return total.add(bundleItem.lineTotal);
      },
      Money.zero(),
    );

    // Applying discount
    const appliedDiscount = this.applyDiscount(
      displayUnitPrice,
      item.quantity,
      discount,
    );

    const lineTotal = displayUnitPrice
      .multiply(item.quantity)
      .subtract(appliedDiscount?.totalDiscount ?? Money.zero());

    return {
      ...item,
      items: [...displayPricedBundleItems.toArray()],
      unitPrice: displayUnitPrice,
      discount: appliedDiscount,
      lineTotal,
    };
  }

  private applyDiscount(
    price: Money,
    quantity: number,
    discount?: ApplicableDiscount,
  ) {
    return discount
      ? discount.kind === "campaign"
        ? this.applyCampaignDiscount(price, discount, quantity)
        : this.applySpecificDiscount(discount, quantity)
      : undefined;
  }

  private applySpecificDiscount(
    discount: ApplicableSpecificDiscount,
    quantity: number,
  ): AppliedDiscount {
    const discountedQuantity =
      discount.applicableQuantity === "unlimited"
        ? quantity
        : Math.min(discount.applicableQuantity, quantity);
    return {
      source: {
        id: discount.id,
        isLimited: discount.applicableQuantity !== "unlimited",
      },
      discountPerUnit: discount.displayDiscountPerUnit,
      discountedQuantity,
      totalDiscount:
        discount.displayDiscountPerUnit.multiply(discountedQuantity),
    };
  }

  private applyCampaignDiscount(
    price: Money,
    discount: ApplicableCampaignDiscount,
    quantity: number,
  ): AppliedDiscount {
    const discountPerUnit = price.multiply(discount.displayDiscountRate);
    const discountedQuantity =
      discount.applicableQuantity === "unlimited"
        ? quantity
        : Math.min(discount.applicableQuantity, quantity);

    return {
      source: {
        id: discount.id,
        isLimited: discount.applicableQuantity !== "unlimited",
      },
      discountPerUnit,
      discountedQuantity,
      totalDiscount: discountPerUnit.multiply(discountedQuantity),
    };
  }

  private calculateUnitPrice(purchasePrice: Money, markup: number): Money {
    return purchasePrice.multiply(1 + markup);
  }

  private calculateDisplayPrice(
    realPrice: Money,
    discount?: ApplicableDiscount,
  ): Money {
    if (!discount) return realPrice;

    switch (discount.kind) {
      case "campaign": {
        const priceFactor =
          (1 - discount.realDiscountRate) / (1 - discount.displayDiscountRate);

        return realPrice.multiply(priceFactor);
      }

      case "specific": {
        const fakeDiscount = discount.displayDiscountPerUnit.subtract(
          discount.realDiscountPerUnit,
        );

        return realPrice.add(fakeDiscount);
      }
    }
  }

  private calculateBundleDisplayItems(
    items: LineItems<BundleComponentInvoiceItem>,
    discount: ApplicableDiscount,
  ): LineItems<BundleComponentInvoiceItem> {
    const realBundlePrice = items.reduce(
      (total, item) => total.add(item.lineTotal),
      Money.zero(),
    );

    const displayBundlePrice = this.calculateDisplayPrice(
      realBundlePrice,
      discount,
    );

    const adjustment = displayBundlePrice.subtract(realBundlePrice);

    return items.transform(
      (item) => {
        const ratio = item.lineTotal.divide(realBundlePrice.value).value;

        const displayAdjustment = adjustment.multiply(ratio);

        const displayUnitPrice = item.unitPrice.add(
          displayAdjustment.divide(item.quantity),
        );

        return {
          ...item,
          unitPrice: displayUnitPrice,
          lineTotal: displayUnitPrice.multiply(item.quantity),
        };
      },
      (item) => item.productId,
    );
  }

  private collectLeafProductIds(products: Iterable<Product>): string[] {
    const ids: string[] = [];

    for (const product of products) {
      if (product.kind === "bundle") {
        for (const item of product.items) {
          ids.push(item.id);
        }
      } else {
        ids.push(product.id);
      }
    }

    return ids;
  }
}
