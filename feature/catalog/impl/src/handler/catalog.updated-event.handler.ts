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

  async handle(payload: CategoryUpdatedEventPayload): Promise<void> {}
}
