import { CustomerType } from "@feature/common";
import { type IDiscountService } from "@feature/discount-api";
import {
  IPricingService,
  LineTotalPricingRequest,
  LineTotalPricingResponse,
  ManyUnitPricingRequest,
  ManyUnitPricingResponse,
  UnitPricingRequest,
  UnitPricingResponse,
} from "@feature/pricing-api";
import { Injectable } from "@nestjs/common";
import { type IMarkupPolicyProvider } from "./port/markup-policy.provider";
import { type ICustomerRepository } from "./repository/customer.repository";
import { type IPurchaseDocumentRepository } from "./repository/purchase-documents.repository";
import { WholesalePricingCalculator } from "./services/wholesale-pricing-calculator";
import { RetailPricingCalculator } from "./services/retail-pricing-calculator";

interface IPricingCalculator {}

@Injectable()
export class PricingService implements IPricingService {
  constructor(
    private readonly markupPolicyProvider: IMarkupPolicyProvider,
    private readonly discountService: IDiscountService,
    private readonly customerRepository: ICustomerRepository,
    private readonly purchaseDocumentRepository: IPurchaseDocumentRepository,
  ) {}
  async priceUnit(req: UnitPricingRequest): Promise<UnitPricingResponse> {
    const markup = await this.markupPolicyProvider.resolve(req.customerType);

    const purchasePrice =
      this.purchaseDocumentRepository.getLatestPurchasePricesOf([
        req.item.productId,
      ]);

    // NOTE: if customer type is merchant theres no discounts
    // NOTE: if customer type is consumer or technician the markup is same but reward is different

    const calculator: IPricingCalculator =
      req.customerType === "merchant"
        ? new WholesalePricingCalculator()
        : new RetailPricingCalculator();

    const price = calculator.calculateUnitPrice(purchasePrice, markup);

    // NOTE: Rewarding Service should be used inside pos and etc
    return price;
  }
  priceManyUnit(req: ManyUnitPricingRequest): Promise<ManyUnitPricingResponse> {
    throw new Error("Method not implemented.");
  }
  priceLineTotal(
    req: LineTotalPricingRequest,
  ): Promise<LineTotalPricingResponse> {
    throw new Error("Method not implemented.");
  }
}
