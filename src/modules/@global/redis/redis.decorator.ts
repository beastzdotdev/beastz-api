import { Inject } from '@nestjs/common';
import { REDIS_CLIENT_TOKEN } from './redis.constants';

export const InjectRedis = () => Inject(REDIS_CLIENT_TOKEN);
