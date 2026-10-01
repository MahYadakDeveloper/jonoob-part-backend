import { DrizzleDbModule } from '@infra/db-drizzle';
import { Module } from '@nestjs/common';
import { OutboxModule } from '@nestjs/outbox';
import { DrizzleOutboxStore } from './drizzle-outbox.store.js';

@Module({
  imports: [
    OutboxModule.forRoot({
      imports: [DrizzleDbModule],
      relay: {
        enabled: process.env.OUTBOX_RELAY !== 'off',
        pollInterval: '1s',
        lease: '30s',
        publishTimeout: '10s',
      },
      retry: {
        attempts: 10,
        backoff: { delay: '1s', maxDelay: '1m' },
      },
    }),
  ],
  providers: [DrizzleOutboxStore],
  exports: [DrizzleOutboxStore],
})
export class DrizzleOutboxModule {}
