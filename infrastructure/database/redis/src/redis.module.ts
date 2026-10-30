import { DynamicModule, Logger, Module, Provider } from '@nestjs/common';
import { Redis } from 'ioredis';
import { getRedisToken } from './redis.tokens';

export interface RedisClientConfig {
  url: string;
  commandTimeout?: number;
  enableOfflineQueue?: boolean;
  maxRetriesPerRequest?: number | null;
}
export type RedisModuleOptions = Record<string, RedisClientConfig>;

const OPTIONS = Symbol('REDIS_MODULE_OPTIONS');
const SHUTDOWN = Symbol('REDIS_SHUTDOWN');

function createClient(name: string, cfg: RedisClientConfig): Redis {
  const logger = new Logger(`Redis:${name}`);
  const client = new Redis(cfg.url, {
    connectionName: name,
    connectTimeout: 5_000,
    commandTimeout: cfg.commandTimeout,
    enableOfflineQueue: cfg.enableOfflineQueue ?? true,
    maxRetriesPerRequest: cfg.maxRetriesPerRequest ?? 1,
    retryStrategy: (times) => Math.min(times * 100, 2_000),
  });
  client.on('error', (e) => logger.error(e.message)); // URL را لاگ نکنید، پسورد دارد
  client.on('ready', () => logger.log('ready'));
  return client;
}

async function waitUntilReady(client: Redis, timeoutMs = 10_000) {
  if (client.status === 'ready') return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Redis connect timeout')),
      timeoutMs,
    );
    client.once('ready', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

@Module({})
export class RedisModule {
  static forRootAsync(opts: {
    names: string[];
    imports?: any[];
    inject?: any[];
    useFactory: (
      ...args: any[]
    ) => RedisModuleOptions | Promise<RedisModuleOptions>;
  }): DynamicModule {
    const clientProviders: Provider[] = opts.names.map((name) => ({
      provide: getRedisToken(name),
      inject: [OPTIONS],
      useFactory: async (o: RedisModuleOptions) => {
        const cfg = o[name];
        if (!cfg) throw new Error(`Missing Redis config for "${name}"`);
        const client = createClient(name, cfg);
        await waitUntilReady(client);
        return client;
      },
    }));

    const tokens = opts.names.map(getRedisToken);

    return {
      module: RedisModule,
      global: true,
      imports: opts.imports ?? [],
      providers: [
        {
          provide: OPTIONS,
          inject: opts.inject ?? [],
          useFactory: opts.useFactory,
        },
        ...clientProviders,
        {
          provide: SHUTDOWN,
          inject: tokens,
          useFactory: (...clients: Redis[]) => ({
            onApplicationShutdown: async () => {
              await Promise.allSettled(clients.map((c) => c.quit()));
            },
          }),
        },
      ],
      exports: tokens,
    };
  }
}
