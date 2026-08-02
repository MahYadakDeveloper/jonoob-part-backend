import { ProductRedefinedEventPayload, ProductRedefinedEventType } from '@feature/catalog-api';
import { type BrandApi } from '@feature/catalog-brand-api';
import {
  type FitmentApi,
  FitmentManyDeletedEventPayload,
  FitmentManyUpdatedEventPayload,
  FitmentManyUpdatedEventType,
} from '@feature/catalog.fitment-api';
import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import { Injectable } from '@nestjs/common';
import { type CatalogRepository } from 'repository/catalog.repository';
import { generateSearchText } from 'utils/generate-search-text';

@Injectable()
export class FitmentUpdatedEventHandler extends BaseEventHandler<FitmentManyUpdatedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: CatalogRepository,
    private readonly fitment: FitmentApi,
    private readonly brand: BrandApi,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {
    super(registry, FitmentManyUpdatedEventType);
  }

  async handle(payload: FitmentManyUpdatedEventPayload): Promise<void> {
    const products = await this.repository.findMany({
      where: { references: { fitmentIds: payload.fitmentsIds } },
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
