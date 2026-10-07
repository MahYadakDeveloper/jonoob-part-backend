import { QueueModule } from '@infra/messaging-queue';
import { Module } from '@nestjs/common';

@Module({
  imports: [QueueModule],
})
export class WorkerModule {}
