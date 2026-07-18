export class UnknownEventHandlerError extends Error {
  constructor(
    readonly eventType: string,
  ) {
    super(`No handler found for event: ${eventType}`);
    this.name = UnknownEventHandlerError.name;
  }
}