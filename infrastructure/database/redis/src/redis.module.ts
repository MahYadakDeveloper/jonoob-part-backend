import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisLifecycle } from './redis.lifecycle';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): RedisClientType => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';

        if (!isProduction) {
          return createClient({
            url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
          });
        }

        return createClient({
          username: config.get<string>('REDIS_USERNAME'),
          password: config.get<string>('REDIS_PASSWORD'),
          database: config.get<number>('REDIS_DB', 0),
          socket: {
            host: config.get<string>('REDIS_HOST', 'localhost'),
            port: config.get<number>('REDIS_PORT', 6379),
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
