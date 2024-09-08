import Redis from 'ioredis';
import { Namespace } from 'socket.io';
import { InjectRedis } from '@nestjs-modules/ioredis';

import { BadRequestException, Injectable } from '@nestjs/common';
import { SocketForUserInject } from './document-socket.type';
import { constants } from '../../../../common/constants';
import { FileStructurePublicShareService } from '../../../file-structure-public-share/file-structure-public-share.service';

@Injectable()
export class DocumentSocketService {
  /**
   * @description This variable is only reference to document socket gateway server namespace instance
   */
  public wss: Namespace;

  constructor(
    @InjectRedis()
    private readonly redis: Redis,

    // private readonly collabRedis: CollabRedis,
    private readonly fsPublicShareService: FileStructurePublicShareService,
  ) {}

  async setLock(client: SocketForUserInject) {
    const filesStructureId: number = client.handshake.auth?.filesStructureId;
    const userId = client.handshake?.accessTokenPayload?.userId;

    // This should not happend
    if (!filesStructureId || !userId) {
      throw new BadRequestException('Missing filesStructureId or userId');
    }

    const lockKeyName = constants.redis.buildFSLockName(filesStructureId);

    // expire after 2 day if something happens
    // also this will override if there is dangling key in redis
    await this.redis.set(lockKeyName, userId, 'EX', constants.redis.twoDayInSec);
  }

  async removeLock(client: SocketForUserInject) {
    const filesStructureId: number = client.handshake.auth?.filesStructureId;

    // This should not happend if happens then just disconnect
    if (!filesStructureId) {
      throw new BadRequestException('Missing filesStructureId or userId');
    }

    const lockKeyName = constants.redis.buildFSLockName(filesStructureId);

    await this.redis.del(lockKeyName);
  }

  async checkSharing(client: SocketForUserInject) {
    const fsPublicShares = await this.fsPublicShareService.getManyForSocketUser({
      userId: client.handshake.accessTokenPayload.userId,
    });

    for (const fsPublicShare of fsPublicShares) {
      const fsCollabKeyName = constants.redis.buildFSCollabName(fsPublicShare.uniqueHash);

      await this.redis.hset(fsCollabKeyName, 'masterSocketId', client.id); // update socket id

      // ignore if disabled
      if (fsPublicShare.isDisabled) {
        continue;
      }
    }
  }
}
