import { IEventHandler } from "./event-handler";
import { IEventHandlerRegistry } from "./event-handler-registry";

export abstract class BaseEventHandler<
  TPayload = unknown,
> implements IEventHandler<TPayload> {
  protected constructor(registry: IEventHandlerRegistry, eventType: string) {
    registry.register(eventType, this);
  }

  abstract handle(payload: TPayload): Promise<void>;
}
