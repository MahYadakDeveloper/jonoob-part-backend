import { Money } from "@feature/common";
import { type IDiscountService } from "@feature/discount-api";
import {
  InvoicePricingRequest,
  InvoicePricingResponse,
  IPricingService,
  LineTotalPricingRequest,
  LineTotalPricingResponse,
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
import { type ICustomerRepository } from "./repository/customer.repository";
import { type IPurchaseDocumentRepository } from "./repository/purchase-documents.repository";

@Injectable()
export class PricingService implements IPricingService {
  constructor(
    private readonly markupPolicyProvider: IMarkupPolicyProvider,
    private readonly discountService: IDiscountService,
    private readonly customerRepository: ICustomerRepository,
    private readonly purchaseDocumentRepository: IPurchaseDocumentRepository,
  ) {}
  getPricingPolicy(req: PricingPolicyReq): PricingPolicyRes {
    return { policy: req.customerType === "merchant" ? "wholesale" : "retail" };
  }

  async priceUnit(req: UnitPricingRequest): Promise<UnitPricingResponse> {
    const markup = await this.markupPolicyProvider.resolve(req.policy);

    const purchasePrice =
      await this.purchaseDocumentRepository.getLatestPurchasePricesOf([
        req.item.productId,
      ])[req.item.productId];

    const price = this.calculateUnitPrice(purchasePrice, markup, req.policy);

    return { price };
  }

  async priceManyUnit(
    req: ManyUnitPricingRequest,
  ): Promise<ManyUnitPricingResponse> {
    const markup = await this.markupPolicyProvider.resolve(req.policy);

    const productIds = req.items.map((item) => item.productId);
    const purchasePrices =
      await this.purchaseDocumentRepository.getLatestPurchasePricesOf(
        productIds,
      );

    const prices = productIds.reduce<Record<string, Money>>((prev, curr) => {
      prev[curr] = this.calculateUnitPrice(
        purchasePrices[curr],
        markup,
        req.policy,
      );
      return prev;
    }, {});

    return { prices };
  }

  /**
   * Note: when there is no customer id no discount applied
   */
  priceLineTotal(
    req: LineTotalPricingRequest,
  ): Promise<LineTotalPricingResponse> {
    throw new Error("Method not implemented yet!");
  }

  priceInvoice(req: InvoicePricingRequest): Promise<InvoicePricingResponse> {
    throw new Error("Method not implemented yet!");
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
