import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

import { Injectable } from '@nestjs/common';
import { SocketForUserInject } from './document-socket.type';
import { DocumentSocketGatewayHelper } from './document-socket.helper';
import { constants } from '../../../../common/constants';

@Injectable()
export class DocumentSocketService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
    private readonly helper: DocumentSocketGatewayHelper,
  ) {}

  async setLock(client: SocketForUserInject) {
    const filesStructureId: number = client.handshake.auth?.filesStructureId;
    const userId = client.handshake?.accessTokenPayload?.userId;

    // This should not happend
    if (!filesStructureId || !userId) {
      client.disconnect();
      return;
    }

    const lockKeyName = this.helper.buildFSLockName(filesStructureId);

    await this.redis.set(lockKeyName, userId, 'EX', constants.redis.twoDayInSec); // expire after 2 day if something happens
  }

  async removeLock(client: SocketForUserInject) {
    const filesStructureId: number = client.handshake.auth?.filesStructureId;

    // This should not happend if happens then just disconnect
    if (!filesStructureId) {
      client.disconnect();
      return;
    }

    const lockKeyName = this.helper.buildFSLockName(filesStructureId);

    await this.redis.del(lockKeyName);
  }
}
