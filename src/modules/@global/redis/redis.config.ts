import { EnvService } from '@global/env';
import { RedisClientOptions } from 'redis';

export const redisConfig = (env: EnvService): RedisClientOptions => ({
  url: env.get('REDIS_URL'),
});
