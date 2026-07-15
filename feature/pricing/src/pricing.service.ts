import {
  AppliedDiscount,
  CustomerType,
  InvoiceItem,
  InvoiceSummary,
  LineItems,
  Money,
} from "@feature/common";
import { type ICustomersService } from "@feature/customer-api";
import {
  CampaignDiscount,
  ProductDiscount,
  SpecificDiscount,
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
import { type IMarkupPolicyProvider } from "./port/markup-policy.provider";
import { Product, type IProductQuerier } from "./port/product.querier";
import { PurchasePrice, type IPurchaseQuerier } from "./port/purchase.querier";
import { type ICustomerRepository } from "./repository/customer.repository";

@Injectable()
export class PricingService implements IPricingService {
  constructor(
    private readonly markupPolicyProvider: IMarkupPolicyProvider,
    private readonly discountService: IDiscountService,
    private readonly customersService: ICustomersService,
    private readonly productQuerier: IProductQuerier,
    private readonly customerRepository: ICustomerRepository,

    private readonly purchaseQuerier: IPurchaseQuerier,
  ) {}

  async resolvePricingPolicy({
    customerId,
  }: PricingPolicyReq): Promise<PricingPolicyRes> {
    const { customerType } = await this.customersService.getCustomerType({
      customerId,
    });

    return { policy: customerType === "merchant" ? "wholesale" : "retail" };
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
    const products = await this.productQuerier.findMany([...items.keys()]);

    for (const productId of items.keys()) {
      if (!products.has(productId)) throw new ProductNotFoundError(productId);
    }

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
    const products = await this.productQuerier.findMany([...items.keys()]);
    for (const item of items) {
      if (!products.has(item.productId)) {
        throw new ProductNotFoundError(item.productId);
      }
    }

    // Resolving purchase prices
    const leafProductIds = this.collectLeafProductIds(products);
    const purchasePrices = await this.purchaseQuerier.findMany(leafProductIds);

    // Resolving markup
    const customerType: CustomerType = customerId
      ? (
          await this.customersService.getCustomerType({
            customerId,
          })
        ).customerType
      : "consumer";
    const policy = customerType === "merchant" ? "wholesale" : "retail";
    const markup = await this.markupPolicyProvider.resolve(policy);

    const discounts =
      !!customerId && policy !== "wholesale"
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
    discount?: ProductDiscount,
  ): InvoiceItem {
    const purchasePrice = purchasePrices.getOrThrow(
      item.productId,
      (id) => new PurchasePriceNotFoundError(id),
    ).price;

    const unitPrice = this.calculateUnitPrice(purchasePrice, markup);
    const appliedDiscount = this.applyDiscount(
      unitPrice,
      item.quantity,
      discount,
    );
    const lineTotal = unitPrice
      .multiply(item.quantity)
      .subtract(appliedDiscount?.totalDiscount ?? Money.zero());
    return {
      ...item,
      unitPrice,
      discount: appliedDiscount,
      lineTotal,
    };
  }

  private priceBundleInvoiceItem(
    item: UnpricedBundleInvoiceItem,
    purchasePrices: LineItems<PurchasePrice>,
    markup: number,
    discount?: ProductDiscount,
  ): InvoiceItem {
    const pricedBundleItems = new LineItems<BundleComponentInvoiceItem>(
      (x) => x.productId,
    );

    for (const bundleItem of item.items) {
      const purchasePrice = purchasePrices.getOrThrow(
        bundleItem.productId,
        (id) => new PurchasePriceNotFoundError(id),
      ).price;

      const unitPrice = this.calculateUnitPrice(purchasePrice, markup);
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
    const appliedDiscount = this.applyDiscount(
      unitPrice,
      item.quantity,
      discount,
    );
    const lineTotal = unitPrice
      .multiply(item.quantity)
      .subtract(appliedDiscount?.totalDiscount ?? Money.zero());

    return {
      ...item,
      items: [...pricedBundleItems.toArray()],
      unitPrice,
      discount: appliedDiscount,
      lineTotal,
    };
  }

  private applyDiscount(
    price: Money,
    quantity: number,
    discount?: ProductDiscount,
  ) {
    return discount
      ? discount.kind === "campaign"
        ? this.applyCampaignDiscount(price, discount, quantity)
        : this.applySpecificDiscount(discount, quantity)
      : undefined;
  }

  private applySpecificDiscount(
    discount: SpecificDiscount,
    quantity: number,
  ): AppliedDiscount {
    const discountedQuantity =
      discount.applicableQuantity === "unlimited"
        ? quantity
        : Math.min(discount.applicableQuantity, quantity);
    return {
      discountPerUnit: discount.discountPerUnit,
      discountedQuantity,
      totalDiscount: discount.discountPerUnit.multiply(discountedQuantity),
    };
  }
  private applyCampaignDiscount(
    price: Money,
    discount: CampaignDiscount,
    quantity: number,
  ): AppliedDiscount {
    const discountPerUnit = price.multiply(discount.discountRate);
    return {
      discountPerUnit,
      discountedQuantity: quantity,
      totalDiscount: discountPerUnit.multiply(quantity),
    };
  }

  private calculateUnitPrice(purchasePrice: Money, markup: number): Money {
    return purchasePrice.multiply(1 + markup);
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
