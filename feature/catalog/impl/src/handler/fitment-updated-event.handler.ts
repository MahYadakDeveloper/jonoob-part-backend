import { ProductRedefinedEventPayload, ProductRedefinedEventType } from '@feature/catalog-api';
import { type BrandApi } from '@feature/catalog-brand-api';
import {
  type FitmentApi,
  FitmentUpdatedEventPayload,
  FitmentUpdatedEventType,
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
export class FitmentUpdatedEventHandler extends BaseEventHandler<FitmentUpdatedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: CatalogRepository,
    private readonly fitment: FitmentApi,
    private readonly brand: BrandApi,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {
    super(registry, FitmentUpdatedEventType);
  }

  async handle(payload: FitmentUpdatedEventPayload): Promise<void> {
    const products = await this.repository.findMany({
      where: { references: { fitmentIds: [payload.fitmentsId] } },
    });
    if (products.size === 0) return;

    await Promise.all([
      products.toArray().map((product) =>
        this.tx.run(async () => {
          // Updating
          const { fitment } = await this.fitment.find({
            fitmentId: payload.fitmentsId,
          });
          const brandId = product.references.brandId;
          const brand = brandId ? (await this.brand.find({ brandId })).brand : undefined;
          await this.repository.update(product.id, {
            ...product,
            searchText: generateSearchText({
              canonicalName: product.canonicalName,
              aliases: product.aliases,
              fitments: [fitment].toLineItems((x) => x.id),
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
