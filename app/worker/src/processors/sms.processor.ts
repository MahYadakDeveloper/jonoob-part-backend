import { SMS_QUEUE_NAME } from '@infra/messaging-queue/constants';
import { Processor } from '@nestjs/bullmq';

@Processor(SMS_QUEUE_NAME)
export class SmsProcessor {}
