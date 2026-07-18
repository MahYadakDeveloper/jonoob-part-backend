import { IEventHandler, IEventHandlerRegistry } from "@feature/common";

export class EventHandlerRegistry implements IEventHandlerRegistry {
  private readonly handlers = new Map<string, IEventHandler>();
  register(eventType: string, handler: IEventHandler): void {
    if (this.handlers.has(eventType)) {
      throw new Error(`Handler already registered for ${eventType}`);
    }

    this.handlers.set(eventType, handler);
  }
  get(eventType: string): IEventHandler | undefined {
    return this.handlers.get(eventType);
  }
}
