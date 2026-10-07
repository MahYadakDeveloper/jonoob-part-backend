import { RedisModule } from '@infra/db-redis';
import { Module } from '@nestjs/common';
import { TokenBucketRateLimitService } from './redis-token-bucket';

@Module({
  imports: [RedisModule],
  providers: [TokenBucketRateLimitService],
  exports: [TokenBucketRateLimitService],
})
export class RateLimitModule {}
