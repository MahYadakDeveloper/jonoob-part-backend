import { Money } from "@feature/common";
import { type PricingApi } from "@feature/pricing-api";
import { type WarehouseApi } from "@feature/warehouse-api";
import { EnrichedData, ProductRaw } from "model/product";

export class CatalogService {
  constructor(
    private readonly catalog: CatalogRepository,
    private readonly warehouse: WarehouseApi,
    private readonly pricing: PricingApi,
  ) {}
  /**
   * Infra Note For future: use redis for this.
   * This method is responsible for enriching information such as price, stock, discounts, and more.
   */
  private async enrich(
    product: ProductRaw,
  ): Promise<ProductRaw & { enriched: EnrichedData }> {
    if (product.kind === "leaf") {
      const leaf = product;

      // stock + details
      const [{ good }, { price }] = await Promise.all([
        this.warehouse.getWarehouseView({
          goodId: leaf.goodId,
        }),
        this.pricing.priceProduct({ productId: leaf.id }),
      ]);

      return {
        ...leaf,
        enriched: {
          price,
          stock: good.stock,
          storageLocation: good.storageLocation,
          unitOfMeasure: good.unitOfMeasure,
        },
      };
    }

    const bundle = product;
    const bundleItemsByGoodId = bundle.items.indexedBy((x) => x.goodId);
    const bundleItemsByProductId = bundle.items.indexedBy((x) => x.productId);
    const goodIds = [...bundleItemsByGoodId.keys()];
    const productIds = [...bundleItemsByProductId.keys()];

    // warehouse + pricing
    const [{ stocks }, { prices }] = await Promise.all([
      this.warehouse.getGoodStocks({
        goodIds,
      }),
      this.pricing.priceManyProduct({
        productIds,
      }),
    ]);

    const stock = stocks.reduce((minBundleStock, item) => {
      const quantity = bundleItemsByGoodId.getOrThrow(item.goodId).quantity;

      return Math.min(minBundleStock, Math.floor(item.stock / quantity));
    }, 0);

    const price = prices.reduce((bundlePrice, itemPrice) => {
      return bundlePrice.add(
        itemPrice.price.multiply(
          bundleItemsByProductId.getOrThrow(itemPrice.productId).quantity,
        ),
      );
    }, Money.zero());

    return {
      ...bundle,
      enriched: {
        price,
        stock,
      },
    };
  }

  /**
   * Infra Note For future: use redis for this.
   * This method is responsible for populating information such as display name, description, images, and more.
   */
  private populate(product: Product): Promise<Product> {
    throw new Error("Method not implemented yet!");
  }

  /**
   * Note: Redis would be used as cache aside for the product too
   *  only product only retrieved by redis if products id is given.
   *
   * Note: For meaningful or anything else for product searching
   *  we use elastic
   * Retrieves a product by its ID.
   *
   * Workflow:
   * 1. Retrieve the product stock (defaults to zero if not found).
   * 2. Enrich the product with dynamic information when it is in stock.
   * 3. Populate descriptive information.
   * 4. Return the assembled product.
   *
   * Throws if the product cannot be populated.
   *
   * req: {
   *  ...
   *  view: "enriched" | "populated" | "full"
   *  ...
   * }
   */
  findById(): Promise<Product> {
    throw new Error("Method not implemented yet!");
  }
  findManyById(): Promise<Product> {
    throw new Error("Method not implemented yet!");
  }

  async findByBarcode({
    barcode,
    enrich,
    populate,
  }: FindProductByBarcodeRequest): Promise<FindProductByBarcodeResponse> {
    // Resolve product id
    const { goodId } = await this.warehouse.resolveGoodId({ barcode });

    let product: Product = this.catalog.findOrCreate(goodId); // Note: in prisma to findOrCreate use upsert with update:{}
    if (enrich) {
      product = await this.enrich(product);
    }

    if (populate) {
      product = await this.populate(product);
    }

    return { product };
  }

  /**
   * Note: Redis would be used as cache aside for the product too
   *  only product only retrieved by redis if products id is given.
   *
   * Note: For meaningful or anything else for product searching
   *  we use elastic
   * @param input : {
   *    query?: string;
   *    page: number;
   *    pageSize: number;
   *    sort?: ProductSort;
   *    filter?: Filter;
   *    view: "enriched" | "populated" | "full"
   *    ...
   *  }
   * @param output : {
   *    page: number;
   *    items: Product[]
   *    ...
   * }
   * NOTE: Return type include product list witch their kind may "product" | "bundle"
   */
  search(input) {}

  /**
   * Defines a product and stores its foundational metadata.
   *
   * The created definition is later enriched and populated through
   * `enrich()` and `populate()` to build the complete product representation.
   *
   * A product can represent either a standalone product or a bundle of products.
   *
   * When `visibleOnline` is enabled, both `EnrichedDataInput` and
   * `PopulatedDataInput` must be provided; otherwise the operation fails.
   */
  define(req: DefiningProductRequest): Promise<{ productId: string }> {}
}
