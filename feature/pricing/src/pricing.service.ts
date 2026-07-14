import { LineItems, Money } from "@feature/common";
import { type IDiscountService } from "@feature/discount-api";
import {
  InvoicePricingRequest,
  InvoicePricingResponse,
  IPricingService,
  ManyUnitPricingRequest,
  ManyUnitPricingResponse,
  PricingPolicy,
  PricingPolicyReq,
  PricingPolicyRes,
  UnitPricingRequest,
  UnitPricingResponse,
} from "@feature/pricing-api";
import { Injectable } from "@nestjs/common";
import { type IMarkupPolicyProvider } from "./port/markup-policy.provider";
import { type IProductQuerier } from "./port/product.querier";
import { type ICustomerRepository } from "./repository/customer.repository";
import { type IPurchaseQuerier } from "./port/purchase.querier";
import { PurchasePriceNotFoundError } from "./errors/purchase-price-not-found.error";

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

  async priceUnit({
    item,
    customerId,
    policy,
  }: UnitPricingRequest): Promise<UnitPricingResponse> {
    const markup = await this.markupPolicyProvider.resolve(policy);

    // Resolving product
    const product = await this.productQuerier.find(item.productId);
    if (!product) throw new Error("General error.");

    const discount = customerId
      ? (
          await this.discountService.findApplicableDiscount({
            customerId,
            item: {
              productId: product.id,
              quantity: 1,
            },
          })
        ).discount
      : undefined;

    if (product.kind === "product") {
      const purchasePrice = await this.purchaseQuerier.find(item.productId);

      if (!purchasePrice) throw new PurchasePriceNotFoundError(product.id);

      const price = this.calculateUnitPrice(
        purchasePrice.price,
        markup,
        policy,
      );

      return { price, discount };
    }

    const purchasePrices = await this.purchaseQuerier.findMany([
      ...product.items.transform(
        (item) => item.id,
        (item) => item,
      ),
    ]);

    const price = product.items.reduce((total, item) => {
      const purchasePrice = purchasePrices.getOrThrow(
        item.id,
        (id) => new PurchasePriceNotFoundError(id),
      ).price;

      return total.add(
        this.calculateUnitPrice(purchasePrice, markup, policy).multiply(
          item.qty,
        ),
      );
    }, Money.zero());

    return { price };
  }

  // TODO Add discount for this many unit price and unit price above
  async priceManyUnit({
    items,
    customerId,
    policy,
  }: ManyUnitPricingRequest): Promise<ManyUnitPricingResponse> {
    const markup = await this.markupPolicyProvider.resolve(policy);

    // Resolving product
    const products = await this.productQuerier.findMany([
      ...items
        .transform(
          (item) => item.productId,
          (id) => id,
        )
        .values(),
    ]);

    const prices = new LineItems<{ productId: string; price: Money }>(
      (item) => item.productId,
    );
    for (const product of products) {
      if (product.kind === "product") {
        const purchasePrice = await this.purchaseQuerier.find(product.id);

        if (!purchasePrice) throw new PurchasePriceNotFoundError(product.id);

        const price = this.calculateUnitPrice(
          purchasePrice.price,
          markup,
          policy,
        );

        prices.set({ productId: product.id, price });

        continue;
      }

      const purchasePrices = await this.purchaseQuerier.findMany([
        ...product.items.transform(
          (item) => item.id,
          (item) => item,
        ),
      ]);

      const price = product.items.reduce((total, item) => {
        const purchasePrice = purchasePrices.getOrThrow(
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

    if (customerId) {
      this.discountService.findManyApplicableDiscount({
        customerId,
        
      })
    }

    return { prices };
  }

  priceInvoice(req: InvoicePricingRequest): Promise<InvoicePricingResponse> {
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
