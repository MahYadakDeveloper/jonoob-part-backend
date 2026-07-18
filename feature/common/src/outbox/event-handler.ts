import { IEventHandlerRegistry } from "./event-handler-registry";

export interface IEventHandler<TPayload = unknown> {
  handle(payload: TPayload): Promise<void>;
}
