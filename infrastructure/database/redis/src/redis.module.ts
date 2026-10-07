import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';
import { redisConfig } from './redis.config';
import { REDIS_CLIENT } from './redis.constants';
import { RedisLifecycle } from './redis.lifecycle';

@Global()
@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [redisConfig.KEY],
      useFactory: (config: ConfigType<typeof redisConfig>): RedisClientType => {
        return createClient({
          username: config.username,
          password: config.password,
          database: config.database,
          socket: {
            host: config.host,
            port: config.port,
            tls: true,
          },
        });
      },
    },
    RedisLifecycle,
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
