import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

@Module({
  imports: [
    // BullMQ is configured in AppModule via BullModule.forRoot(),
    // so only the queue needs to be registered here.
    BullModule.registerQueue({
      name: "events",
    }),
  ],
})
export class QueueModule {}
