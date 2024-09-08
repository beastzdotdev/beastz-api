import { Global, Module } from '@nestjs/common';
import { CollabRedis } from './collab.redis';

@Global()
@Module({
  providers: [CollabRedis],
  exports: [CollabRedis],
})
export class RedisServicesModule {}
