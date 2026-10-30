import { Inject } from '@nestjs/common';

export const getRedisToken = (name = 'default') => `REDIS_CLIENT:${name}`;
export const InjectRedis = (name?: string) => Inject(getRedisToken(name));
