import { EventHandler, EventHandlerRegistry } from "@feature/common";

export class EventHandlerRegistryImpl implements EventHandlerRegistry {
  private readonly handlers = new Map<string, EventHandler>();
  register(eventType: string, handler: EventHandler): void {
    if (this.handlers.has(eventType)) {
      throw new Error(`Handler already registered for ${eventType}`);
    }

    this.handlers.set(eventType, handler);
  }
  get(eventType: string): EventHandler | undefined {
    return this.handlers.get(eventType);
  }
}
