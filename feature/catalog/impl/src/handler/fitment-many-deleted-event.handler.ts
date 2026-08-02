import { ProductRedefinedEventPayload, ProductRedefinedEventType } from '@feature/catalog-api';
import { type BrandApi } from '@feature/catalog-brand-api';
import {
  type FitmentApi,
  FitmentManyDeletedEventPayload,
  FitmentManyDeletedEventType,
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
export class FitmentManyDeletedEventHandler extends BaseEventHandler<FitmentManyDeletedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: CatalogRepository,
    private readonly fitment: FitmentApi,
    private readonly brand: BrandApi,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {
    super(registry, FitmentManyDeletedEventType);
  }

  async handle(payload: FitmentManyDeletedEventPayload): Promise<void> {
    const products = await this.repository.findMany({
      where: { references: { fitmentIds: payload.fitmentsIds } },
    });
    if (products.size === 0) return;

    const filterDeleted = (id: string): boolean => !!payload.fitmentsIds.find((_id) => id === _id);

    await Promise.all([
      products.toArray().map((product) =>
        this.tx.run(async () => {
          // Updating
          const { fitments } = await this.fitment.findMany({
            fitmentIds: product.references.fitmentIds.filter(filterDeleted),
          });
          const brandId = product.references.brandId;
          const brand = brandId ? (await this.brand.find({ brandId })).brand : undefined;
          await this.repository.update(product.id, {
            ...product,
            references: {
              ...product.references,
              fitmentIds: product.references.fitmentIds.filter(filterDeleted),
            },
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
