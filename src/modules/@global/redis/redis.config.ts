import { RedisModuleOptions } from '@nestjs-modules/ioredis';
import { EnvService } from '@global/env';

export const redisConfig = (env: EnvService): RedisModuleOptions => ({
  type: 'single',
  url: env.get('REDIS_URL'),
  options: { lazyConnect: true, host: env.get('REDIS_HOST') },
});
