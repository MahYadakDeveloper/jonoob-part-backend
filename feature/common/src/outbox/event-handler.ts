import { EventHandlerRegistry } from "./event-handler-registry";

export interface EventHandler<TPayload = unknown> {
  handle(payload: TPayload): Promise<void>;
}
