import { RedisClientType, SetOptions } from 'redis';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from './redis.decorator';
import { HSETObject } from '../../../model/types';

type RedisValue = string | number;

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @InjectRedis()
    private readonly redis: RedisClientType,
  ) {}

  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.redis.exists(key);
      return value === 1;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  async set(key: string, value: RedisValue, options?: SetOptions): Promise<string | null> {
    try {
      return await this.redis.set(key, value, options);
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async hsetsingle(key: string, field: string, value: string): Promise<void> {
    await this.redis.HSET(key, field, value);
  }

  async hsetobject(key: string, setValue: HSETObject): Promise<void> {
    await this.redis.HSET(key, setValue);
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      const value = await this.redis.HGET(key, field);

      if (!value) {
        return null;
      }

      return value;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async hgetall<T = object>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.HGETALL(key);

      if (!Object.keys(value).length) {
        return null;
      }

      return value as T;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async del(key: string | string[]): Promise<void> {
    await this.redis.del(key);
  }
}
