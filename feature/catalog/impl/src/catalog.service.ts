import { type BrandApi } from '@feature/brand-api';
import { type CategoryApi } from '@feature/category-api';
import { BundleItem, LineItems } from '@feature/common';
import { type FitmentApi } from '@feature/fitment-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import {
  DefiningProductRequest,
  FindByBarcodeRequest,
  FindManyProductRequest,
  FindProductRequest,
  RedefiningProductRequest,
} from 'catalog.requests';
import {
  DefiningProductResponse,
  FindByBarcodeResponse,
  FindManyProductResponse,
  FindProductResponse,
} from 'catalog.responses';
import { isDefined, isNotFound, Populate, ProductPatch, ProductPopulatePatch } from 'catalog.types';
import { CatalogVisibility, type CatalogContextProvider } from 'context/catalog.context';
import { ProductDto } from 'dto/product.dto';
import { SearchProductParamsDto } from 'dto/search-params.dto';
import { Product, SpecificationReferences } from 'model/product';
import { ProductSearchCriteria, ProductSearchResult } from 'repository/search';
import { type CatalogRepository } from './repository/catalog.repository';

@Injectable()
export class CatalogService {
  private readonly populators: Record<
    keyof Populate,
    (products: LineItems<Product>) => Promise<ProductPopulatePatch>
  >;
  constructor(
    private readonly catalog: CatalogRepository,
    private readonly brand: BrandApi,
    private readonly fitment: FitmentApi,
    private readonly category: CategoryApi,
    private readonly warehouse: WarehouseApi,
    private readonly ctx: CatalogContextProvider,
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
    const products = await this.catalog.findManyById(productIds);

    const dto = await this.populate(products, populate);

    return {
      products: dto,
    };
  }

  async findByBarcode({ barcode, populate }: FindByBarcodeRequest): Promise<FindByBarcodeResponse> {
    // Resolve product id
    const { goodId } = await this.warehouse.resolveGoodId({ barcode });

    const product = await this.catalog.findByGoodId(goodId);

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
   */
  async search(input: SearchProductParamsDto): Promise<ProductSearchResult> {
    const storefront = this.ctx.current().visibility === CatalogVisibility.Storefront;
    const criteria: ProductSearchCriteria = {
      ...input,
      storefront,
    };
    return this.catalog.search(criteria);
  }

  /**
   * Defines a product and stores its foundational metadata.
   *
   * A product can represent either a standalone product or a bundle of products.
   */
  async define({ definitions }: DefiningProductRequest): Promise<DefiningProductResponse> {
    // [TODO] Move media upload orchestration to the controller and let this method accept only MediaRef values.

    if (definitions.kind === 'leaf') {
      // No meaning when there is the good in warehouse not existed and we have id of it, so
      // the checking by warehouse will throw an error
      await this.checkStockExistence(definitions.goodId);
    } else await this.validateBundleItems(definitions.items);

    // Validating references
    await this.validateReferences(definitions.references);

    // Creating
    const { id } = await this.catalog.create(definitions);

    return { productId: id };
  }

  async redefine({ productId, definitions }: RedefiningProductRequest): Promise<void> {
    const product = await this.catalog.findById(productId);

    if (!product) throw new Error(`The product not found ${productId}`);

    if (definitions.kind === 'bundle') {
      await this.validateBundleItems(definitions.items);
    }

    // Validating references
    await this.validateReferences(definitions.references);

    // Updating
    await this.catalog.update(definitions);
  }

  private async validateBundleItems(items: LineItems<BundleItem>) {
    const itemsByProductId = items.indexedBy((x) => x.productId);
    const itemsByGoodId = items.indexedBy((x) => x.goodId);
    const products = await this.catalog.findManyById([...itemsByProductId.keys()]);
    const { stocks } = await this.warehouse.getGoodStocks({ goodIds: [...itemsByGoodId.keys()] });

    // validating leaf products
    for (const bundleItem of items) {
      const product = products.getOrThrow(
        bundleItem.productId,
        (id) => new Error(`Product not found. id: ${id}`),
      );
      if (product.kind !== 'leaf') throw new Error('Only leaf product allowed!');

      // stock check
      if (bundleItem.quantity > stocks.getOrThrow(bundleItem.goodId).stock)
        throw new Error(
          `Insufficient stock to create one bundle at least!, ProductId: ${bundleItem.productId}`,
        );
    }
  }

  private async checkStockExistence(goodId: string) {
    const { stocks } = await this.warehouse.checkStockExistence({ goodIds: [goodId] });
    if (!stocks.getOrThrow(goodId).exists) throw new Error(`No good found in warehouse: ${goodId}`);
    const existingProduct = await this.catalog.findByGoodId(goodId);

    if (existingProduct) {
      throw new Error(`A product is already defined for good '${goodId}'.`);
    }
  }

  private async validateReferences({
    brandId,
    fitmentIds,
    categoryIds,
    manufacturerId,
  }: SpecificationReferences) {
    if (brandId && (await this.brand.findById({ id: brandId }).then(isNotFound)))
      throw new Error(`Brand reference not found!, Id: ${brandId}`);

    if (manufacturerId && (await this.brand.findById({ id: manufacturerId }).then(isNotFound)))
      throw new Error(`Manufacture reference not found!, Id: ${manufacturerId}`);

    if (fitmentIds.length > 0) {
      const { fitments } = await this.fitment.findManyByIds({ ids: fitmentIds });
      for (const fitmentId of fitmentIds) {
        if (!fitments.has(fitmentId))
          throw new Error('Invalid fitment reference found in fitment references.');
      }
    }

    if (categoryIds.length > 0) {
      const { categories } = await this.category.findManyByIds({ ids: categoryIds });
      for (const categoryId of categoryIds) {
        if (!categories.has(categoryId))
          throw new Error('Invalid category reference found in category references.');
      }
    }
  }

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
