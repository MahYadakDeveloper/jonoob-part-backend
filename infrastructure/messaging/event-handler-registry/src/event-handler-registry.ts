import { EventHandler, EventHandlerRegistry } from '@feature/common';

export class EventHandlerRegistryImpl implements EventHandlerRegistry {
  private readonly handlers = new Map<string, EventHandler[]>();
  register(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) ?? [];

    handlers.push(handler);

    this.handlers.set(eventType, handlers);
  }
  get(eventType: string): EventHandler[] {
    return this.handlers.get(eventType) ?? [];
  }
}
