import { type BrandApi } from '@feature/brand-api';
import { type CategoryApi } from '@feature/category-api';
import { LineItems } from '@feature/common';
import { type FitmentApi } from '@feature/fitment-api';
import { type PricingApi } from '@feature/pricing-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { type CatalogRepository } from 'catalog.repository';
import {
  FindManyProductRequest,
  FindProductByBarcodeRequest,
  FindProductRequest,
} from 'catalog.requests';
import {
  FindManyProductResponse,
  FindProductByBarcodeResponse,
  FindProductResponse,
} from 'catalog.responses';
import { Populate } from 'catalog.types';
import { ProductDto } from 'dto/product-dto';
import { Product } from 'model/product';

type ProductPatch = Partial<ProductDto> & { id: string };
type ProductPopulatePatch = LineItems<ProductPatch>;
function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

@Injectable()
export class CatalogService {
  private readonly populators: Record<
    keyof Populate,
    (products: LineItems<Product>) => Promise<ProductPopulatePatch>
  >;
  constructor(
    private readonly catalog: CatalogRepository,
    private readonly warehouse: WarehouseApi,
    private readonly brand: BrandApi,
    private readonly fitment: FitmentApi,
    private readonly category: CategoryApi,
    private readonly pricing: PricingApi,
  ) {
    this.populators = {
      brand: async (products: LineItems<Product>): Promise<ProductPopulatePatch> => {
        const patches = new LineItems<ProductPatch>((patch) => patch.id);

        const brandIds = [
          ...new Set(
            [...products]
              .map((product) => product.references.brandId)
              .filter((id): id is string => !!id),
          ),
        ];

        if (brandIds.length === 0) {
          return patches;
        }

        const { brands } = await this.brand.findManyByIds({
          ids: brandIds,
        });

        for (const product of products) {
          const brandId = product.references.brandId;

          if (!brandId) {
            continue;
          }

          const brand = brands.get(brandId);

          if (!brand) {
            continue;
          }

          patches.set({
            id: product.id,
            brand,
          });
        }

        return patches;
      },

      categories: async (products: LineItems<Product>): Promise<ProductPopulatePatch> => {
        const patches = new LineItems<ProductPatch>((patch) => patch.id);

        const categoryIds = [
          ...new Set([...products].flatMap((product) => product.references.categoryIds)),
        ];

        if (categoryIds.length === 0) {
          return patches;
        }

        const { categories } = await this.category.findManyByIds({
          ids: categoryIds,
        });

        for (const product of products) {
          patches.set({
            id: product.id,
            categories: product.references.categoryIds
              .map((id) => categories.get(id))
              .filter(isDefined),
          });
        }

        return patches;
      },

      fitments: async (products: LineItems<Product>): Promise<ProductPopulatePatch> => {
        const patches = new LineItems<ProductPatch>((patch) => patch.id);

        const fitmentIds = [
          ...new Set([...products].flatMap((product) => product.references.fitmentIds)),
        ];

        if (fitmentIds.length === 0) {
          return patches;
        }

        const { fitments } = await this.fitment.findManyByIds({
          ids: fitmentIds,
        });

        for (const product of products) {
          patches.set({
            id: product.id,
            fitments: product.references.fitmentIds.map((id) => fitments.get(id)).filter(isDefined),
          });
        }

        return patches;
      },
    } satisfies Record<
      keyof Populate,
      (products: LineItems<Product>) => Promise<ProductPopulatePatch>
    >;
  }

  /**
   * Note: Redis would be used as cache aside for the product too
   *  only product only retrieved by redis if products id is given.
   *
   * Note: For meaningful or anything else for product searching
   *  we use elastic
   * Retrieves a product by its ID.
   */
  async findById({ productId, populate }: FindProductRequest): Promise<FindProductResponse> {
    const { products } = await this.findManyByIds({ productIds: [productId], populate });
    const dto = products.getOrThrow(productId);
    return { product: dto };
  }
  async findManyByIds({
    productIds,
    populate,
  }: FindManyProductRequest): Promise<FindManyProductResponse> {
    const products = await this.catalog.findProductByIds(productIds);

    const dto = await this.populate(products, populate);

    return {
      products: dto,
    };
  }

  async findProductByBarcode({
    barcode,
    populate,
  }: FindProductByBarcodeRequest): Promise<FindProductByBarcodeResponse> {
    // Resolve product id
    const { goodId } = await this.warehouse.resolveGoodId({ barcode });

    const product = await this.catalog.findProductByGoodId(goodId);

    if (product === null) throw new Error('Product not found!');
    if (product.kind === 'bundle') throw new Error('Only leaf product can be queried by barcode');

    const products = new LineItems<Product>((p) => p.id, [product]);

    const dto = (await this.populate(products, populate)).getOrThrow(product.id);

    return {
      product: dto,
    };
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

  private async populate(
    products: LineItems<Product>,
    populate: Populate,
  ): Promise<LineItems<ProductDto>> {
    const result = new LineItems<ProductDto>((product) => product.id);

    // Initialize with raw products
    for (const product of products) {
      result.set({
        ...product,
      });
    }

    const patches = await Promise.all(
      (Object.keys(this.populators) as (keyof Populate)[])
        .filter((key) => populate[key])
        .map((key) => this.populators[key](products)),
    );

    for (const patchCollection of patches) {
      for (const patch of patchCollection) {
        const product = result.get(patch.id);

        if (!product) {
          continue;
        }

        Object.assign(product, patch);
      }
    }

    return result;
  }
}
