import { IEventHandler } from "./event-handler";

export interface IEventHandlerRegistry {
  register(eventType: string, handler: IEventHandler): void;

   get(
    eventType: string,
  ): IEventHandler | undefined;   
}
