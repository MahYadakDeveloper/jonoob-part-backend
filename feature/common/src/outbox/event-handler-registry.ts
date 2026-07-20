import { EventHandler } from "./event-handler";

export interface EventHandlerRegistry {
  register(eventType: string, handler: EventHandler): void;

   get(
    eventType: string,
  ): EventHandler | undefined;   
}
