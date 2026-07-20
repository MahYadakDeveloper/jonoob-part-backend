import { EventHandler } from "./event-handler";
import { EventHandlerRegistry } from "./event-handler-registry";

export abstract class BaseEventHandler<
  TPayload = unknown,
> implements EventHandler<TPayload> {
  protected constructor(registry: EventHandlerRegistry, eventType: string) {
    registry.register(eventType, this);
  }

  abstract handle(payload: TPayload): Promise<void>;
}
