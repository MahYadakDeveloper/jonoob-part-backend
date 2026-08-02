import {
  FitmentManyDeletedEventPayload,
  FitmentManyDeletedEventType,
} from '@feature/catalog.fitment-api';
import { BaseEventHandler, EventHandlerRegistry } from '@feature/common';
import { CatalogService } from 'catalog.service';
import { CatalogRepository } from 'repository/catalog.repository';

export class FitmentManyDeletedEventHandler extends BaseEventHandler<FitmentManyDeletedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly catalog: CatalogService,
    private readonly repository: CatalogRepository,
  ) {
    super(registry, FitmentManyDeletedEventType);
  }

  async handle(payload: FitmentManyDeletedEventPayload): Promise<void> {
    const products = await this.repository.find({
      where: { references: { fitmentIds: payload.fitmentsIds } },
    });
    if (products.size === 0) return;

    const filterDeleted = (id: string): boolean => !!payload.fitmentsIds.find((_id) => id === _id);

    await Promise.all([
      products.toArray().map((product) =>
        this.catalog.redefine({
          productId: product.id,
          definitions: {
            ...product,
            references: {
              ...product.references,
              fitmentIds: product.references.fitmentIds.filter(filterDeleted),
            },
          },
        }),
      ),
    ]);
  }
}
