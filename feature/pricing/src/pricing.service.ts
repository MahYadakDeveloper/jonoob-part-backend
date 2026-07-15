import {
  BundleInvoiceItem,
  InvoiceItem,
  InvoiceSummary,
  LineItems,
  Money,
  ProductInvoiceItem,
} from "@feature/common";
import {
  ApplicableDiscount,
  type IDiscountService,
} from "@feature/discount-api";
import {
  InvoicePricingRequest,
  InvoicePricingResponse,
  IPricingService,
  ManyProductPricingRequest,
  ManyProductPricingResponse,
  PricingPolicy,
  PricingPolicyReq,
  PricingPolicyRes,
  ProductPricingRequest,
  ProductPricingResponse,
  UnpricedBundleInvoiceItem,
  UnpricedProductInvoiceItem,
} from "@feature/pricing-api";
import { Injectable } from "@nestjs/common";
import { PurchasePriceNotFoundError } from "./errors/purchase-price-not-found.error";
import { type IMarkupPolicyProvider } from "./port/markup-policy.provider";
import { Product, type IProductQuerier } from "./port/product.querier";
import { PurchasePrice, type IPurchaseQuerier } from "./port/purchase.querier";
import { type ICustomerRepository } from "./repository/customer.repository";
import { ProductNotFoundError } from "./errors/product-not-found-error";
import { BundleComponentInvoiceItem } from "./model/bundle-component-invoice-item";

@Injectable()
export class PricingService implements IPricingService {
  constructor(
    private readonly markupPolicyProvider: IMarkupPolicyProvider,
    private readonly discountService: IDiscountService,
    private readonly productQuerier: IProductQuerier,
    private readonly customerRepository: ICustomerRepository,
    private readonly purchaseQuerier: IPurchaseQuerier,
  ) {}

  getPricingPolicy(req: PricingPolicyReq): PricingPolicyRes {
    return { policy: req.customerType === "merchant" ? "wholesale" : "retail" };
  }

  // async _priceProduct({
  //   item,
  //   policy,
  // }: ProductPricingRequest): Promise<ProductPricingResponse> {
  //   const markup = await this.markupPolicyProvider.resolve(policy);

  //   // Resolving product
  //   const product = await this.productQuerier.find(item.productId);

  //   if (product.kind === "product") {
  //     const purchasePrice = await this.purchaseQuerier.find(product.id);

  //     if (!purchasePrice) throw new PurchasePriceNotFoundError(product.id);

  //     const price = this.calculateUnitPrice(
  //       purchasePrice.price,
  //       markup,
  //       policy,
  //     );

  //     return { price };
  //   }

  //   const purchasePrices = await this.purchaseQuerier.findMany([
  //     ...product.items.keys(),
  //   ]);

  //   const price = product.items.reduce((total, item) => {
  //     const purchasePrice = purchasePrices.getOrThrow(
  //       item.id,
  //       (id) => new PurchasePriceNotFoundError(id),
  //     ).price;

  //     return total.add(
  //       this.calculateUnitPrice(purchasePrice, markup, policy).multiply(
  //         item.qty,
  //       ),
  //     );
  //   }, Money.zero());

  //   return { price };
  // }

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
    const products = await this.productQuerier.findMany([...items.keys()]);

    // for (const item of items) {
    //   if (!products.has(item.productId))
    //     throw new ProductNotFoundError(item.productId);
    // }

    const leafProductIds = this.collectLeafProductIds(products);

    const leafPurchasePrices =
      await this.purchaseQuerier.findMany(leafProductIds);

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
              policy,
            )
          : product.items.reduce((total, item) => {
              const purchasePrice = leafPurchasePrices.getOrThrow(
                item.id,
                (id) => new PurchasePriceNotFoundError(id),
              ).price;

              return total.add(
                this.calculateUnitPrice(purchasePrice, markup, policy).multiply(
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
    policy,
    customerId,
  }: InvoicePricingRequest): Promise<InvoicePricingResponse> {
    const discounts = customerId
      ? (
          await this.discountService.findManyApplicableDiscount({
            customerId,
            items: [...items.toArray()],
          })
        ).discounts
      : new LineItems<{
          productId: string;
          applicableDiscount: ApplicableDiscount;
        }>((x) => x.productId);

    // Getting products
    const products = await this.productQuerier.findMany([...items.keys()]);

    // Resolving purchase prices
    const leafProductIds = this.collectLeafProductIds(products);
    const purchasePrices = await this.purchaseQuerier.findMany(leafProductIds);

    // Resolving markup
    const markup = await this.markupPolicyProvider.resolve(policy);

    // Pricing items
    const pricedInvoiceItems = new LineItems<InvoiceItem>((x) => x.productId);
    for (const item of items) {
      const discount = discounts.get(item.productId);

      pricedInvoiceItems.set(
        item.kind === "bundle"
          ? this.priceBundleInvoiceItem(
              item,
              purchasePrices,
              markup,
              policy,
              discount?.applicableDiscount,
            )
          : this.priceProductInvoiceItem(
              item,
              purchasePrices,
              markup,
              policy,
              discount?.applicableDiscount,
            ),
      );
    }

    const pricedSummary: InvoiceSummary = {
      grandTotal: pricedInvoiceItems.reduce((grandTotal, item) => {
        return grandTotal.add(item.lineTotal);
      }, Money.zero()),
      subtotal: pricedInvoiceItems.reduce((subtotal, item) => {
        return subtotal.add(item.unitPrice.multiply(item.quantity));
      }, Money.zero()),
      discount: pricedInvoiceItems.reduce<Money | undefined>(
        (totalDiscount, item) => {
          if (!item.discount) return undefined;
          if (!totalDiscount) return Money.zero().add(item.discount);
          return totalDiscount.add(item.discount);
        },
        undefined,
      ),
    };

    return {
      pricedInvoice: { items: pricedInvoiceItems, summary: pricedSummary },
    };
  }

  private priceProductInvoiceItem(
    item: UnpricedProductInvoiceItem,
    purchasePrices: LineItems<PurchasePrice>,
    markup: number,
    policy: PricingPolicy,
    applicableDiscount?: ApplicableDiscount,
  ): InvoiceItem {
    const purchasePrice = purchasePrices.getOrThrow(
      item.productId,
      (id) => new PurchasePriceNotFoundError(id),
    ).price;

    const unitPrice = this.calculateUnitPrice(purchasePrice, markup, policy);
    const lineTotal = unitPrice
      .multiply(item.quantity)
      .subtract(applicableDiscount?.totalDiscount || Money.zero());
    return {
      ...item,
      unitPrice,
      discount: applicableDiscount?.totalDiscount,
      lineTotal,
    };
  }

  private priceBundleInvoiceItem(
    item: UnpricedBundleInvoiceItem,
    purchasePrices: LineItems<PurchasePrice>,
    markup: number,
    policy: PricingPolicy,
    applicableDiscount?: ApplicableDiscount,
  ): InvoiceItem {
    const pricedBundleItems = new LineItems<BundleComponentInvoiceItem>(
      (x) => x.productId,
    );

    for (const bundleItem of item.items) {
      const purchasePrice = purchasePrices.getOrThrow(
        bundleItem.productId,
        (id) => new PurchasePriceNotFoundError(id),
      ).price;

      const unitPrice = this.calculateUnitPrice(purchasePrice, markup, policy);
      const lineTotal = unitPrice.multiply(bundleItem.quantity);
      pricedBundleItems.set({
        ...bundleItem,
        unitPrice,
        lineTotal,
      });
    }

    // Calculate bundle invoice item
    const unitPrice = pricedBundleItems.reduce((total, bundleItem) => {
      return total.add(bundleItem.lineTotal);
    }, Money.zero());
    const lineTotal = unitPrice
      .multiply(item.quantity)
      .subtract(applicableDiscount?.totalDiscount || Money.zero());

    return {
      ...item,
      items: [...pricedBundleItems.toArray()],
      unitPrice,
      discount: applicableDiscount?.totalDiscount,
      lineTotal,
    };
  }

  private calculateUnitPrice(
    purchasePrice: Money,
    markup: number,
    policy: PricingPolicy,
  ): Money {
    switch (policy) {
      case "retail":
      case "wholesale":
        return purchasePrice.multiply(1 + markup);
    }
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
