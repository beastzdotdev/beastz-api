import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { FsCollabRedisBody } from '../../../model/types';

@Injectable()
export class CollabRedis {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  async getServants(key: string): Promise<string[]> {
    const servants = await this.redis.hget(key, 'servants');

    if (!servants) {
      return [];
    }

    try {
      return JSON.parse(servants) as string[];
    } catch (error) {
      return [];
    }
  }

  async createFsCollabHashTable(
    key: string,
    params: {
      doc: string;
      masterUserId: number;
      servants: string[];
      updates: string[];
      masterSocketId: string | null;
    },
  ) {
    const { doc, masterUserId, servants, updates, masterSocketId } = params;

    // create hash table
    await this.redis.hset(key, <FsCollabRedisBody>{
      doc,
      masterSocketId: masterSocketId === null ? JSON.stringify(null) : masterSocketId,
      masterUserId,
      servants: JSON.stringify(servants),
      updates: JSON.stringify(updates),
    });
  }
}
