import { LineItems, Money } from "@feature/common";
import { type IDiscountService } from "@feature/discount-api";
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
} from "@feature/pricing-api";
import { Injectable } from "@nestjs/common";
import { PurchasePriceNotFoundError } from "./errors/purchase-price-not-found.error";
import { type IMarkupPolicyProvider } from "./port/markup-policy.provider";
import { type IProductQuerier } from "./port/product.querier";
import { type IPurchaseQuerier } from "./port/purchase.querier";
import { type ICustomerRepository } from "./repository/customer.repository";
import { ProductNotFoundError } from "./errors/product-not-found-error";

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

    const leafProductIds = products.reduce<string[]>((ids, product) => {
      if (product.kind === "bundle") {
        for (const item of product.items) {
          ids.push(item.id);
        }
      } else {
        ids.push(product.id);
      }

      return ids;
    }, []);

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

  priceInvoice(req: InvoicePricingRequest): Promise<InvoicePricingResponse> {
    // if (customerId) {
    //       const { discounts } =
    //         await this.discountService.findManyApplicableDiscount({
    //           customerId,
    //           items: [...prices.keys()].map((productId) => ({
    //             productId,
    //             quantity: 1,
    //           })),
    //         });
    //       prices = prices.transform(
    //         (item) => ({
    //           ...item,
    //           discount: discounts.get(item.productId)?.discount,
    //         }),
    //         (item) => item.productId,
    //       );
    //     }
    throw new Error("Method not implemented.");
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
}
