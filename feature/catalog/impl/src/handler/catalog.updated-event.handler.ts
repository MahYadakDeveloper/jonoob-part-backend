import {
  CategoryUpdatedEventPayload,
  CategoryUpdatedEventType,
} from '@feature/catalog-category-api';
import { BaseEventHandler, EventHandlerRegistry } from '@feature/common';
import { CatalogRepository } from 'repository/catalog.repository';

export class CategoryUpdatedEventHandler extends BaseEventHandler<CategoryUpdatedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: CatalogRepository,
  ) {
    super(registry, CategoryUpdatedEventType);
  }

  async handle(payload: CategoryUpdatedEventPayload): Promise<void> {
    const products = await this.repository.find({
      where: { references: { fitmentIds: payload.categoryId } },
    });
    if (products.size === 0) return;

    await Promise.all([
      products.toArray().map((product) =>
        this.tx.run(async () => {
          // Updating
          const { fitments } = await this.fitment.findMany({
            fitmentIds: product.references.fitmentIds,
          });
          const brandId = product.references.brandId;
          const brand = brandId ? (await this.brand.find({ brandId })).brand : undefined;
          await this.repository.update(product.id, {
            ...product,
            searchText: generateSearchText({
              canonicalName: product.canonicalName,
              aliases: product.aliases,
              fitments,
              brand,
            }),
          });

          await this.outbox.save({
            type: ProductRedefinedEventType,
            payload: {
              productId: product.id,
            } satisfies ProductRedefinedEventPayload,
          });
        }),
      ),
    ]);
  }
}
