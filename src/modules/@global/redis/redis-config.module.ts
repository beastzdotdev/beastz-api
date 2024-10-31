import { performance } from 'node:perf_hooks';
import { Module, DynamicModule, Global, Logger, FactoryProvider } from '@nestjs/common';
import { createClient, RedisClientOptions, RedisClientType } from 'redis';
import { CollabRedis } from './collab.redis';
import { REDIS_CLIENT_CONFIG_TOKEN, REDIS_CLIENT_TOKEN } from './redis.constants';
import { RedisService } from './redis.service';
import { ENV_SERVICE_TOKEN, EnvService } from '../env';
import { redisConfig } from './redis.config';

@Global()
@Module({
  providers: [CollabRedis],
  exports: [CollabRedis],
})
export class RedisConfigModule {
  private static readonly envLogger = new Logger(RedisConfigModule.name);

  static async forRootAsync(): Promise<DynamicModule> {
    const time = performance.now();

    this.envLogger.verbose('Started initializing Redis');

    const redisClientConfigProvider: FactoryProvider<RedisClientOptions> = {
      useFactory: (env: EnvService) => redisConfig(env),
      inject: [ENV_SERVICE_TOKEN],
      provide: REDIS_CLIENT_CONFIG_TOKEN,
    };

    const redisClientProvider: FactoryProvider<RedisClientType> = {
      provide: REDIS_CLIENT_TOKEN,
      useFactory: async (config: RedisClientOptions): Promise<RedisClientType> => {
        return new Promise<RedisClientType>((resolve, reject) => {
          const client = createClient(config);

          client.on('error', err => reject(err));
          client
            .connect()
            .then(redisClient => {
              const totalTimeInMs = (performance.now() - time).toFixed(3) + 'ms';
              this.envLogger.verbose(`Redis initialization completed (${totalTimeInMs})`);

              resolve(redisClient as RedisClientType);
            })
            .catch(err => {
              reject(err);
            });
        });
      },
      inject: [REDIS_CLIENT_CONFIG_TOKEN],
    };

    return {
      module: RedisConfigModule,
      providers: [redisClientConfigProvider, redisClientProvider, RedisService],
      exports: [redisClientProvider, RedisService],
    };
  }
}
