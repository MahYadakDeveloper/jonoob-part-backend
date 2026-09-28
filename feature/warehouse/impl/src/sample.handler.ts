import { Logger } from '@nestjs/common';
import { OnOutboxMessage } from '@nestjs/outbox';

export class StockGetHandler {
  private readonly logger = new Logger(StockGetHandler.name);
  @OnOutboxMessage('stock.get', { consumer: 'logger' })
  log(payload: { x: string }) {
    this.logger.log(
      'Hey im logging from handler and payload of outbox message is:',
      payload,
    );
  }
}
