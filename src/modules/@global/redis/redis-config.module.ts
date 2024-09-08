import { RedisModule, RedisModuleOptions } from '@nestjs-modules/ioredis';
import { Module, DynamicModule, Global } from '@nestjs/common';
import { ENV_SERVICE_TOKEN, EnvService } from '@global/env';
import { CollabRedis } from './collab.redis';
import { redisConfig } from './redis.config';

@Global()
@Module({
  providers: [CollabRedis],
  exports: [CollabRedis],
})
export class RedisConfigModule {
  static forRoot(): DynamicModule {
    return {
      module: RedisConfigModule,
      imports: [
        RedisModule.forRootAsync({
          useFactory: (env: EnvService): RedisModuleOptions => redisConfig(env),
          inject: [ENV_SERVICE_TOKEN],
        }),
      ],
    };
  }
}
