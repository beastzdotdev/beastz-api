import path from 'path';
import Redis from 'ioredis';
import { Namespace } from 'socket.io';
import { InjectRedis } from '@nestjs-modules/ioredis';

import { BadRequestException, Injectable } from '@nestjs/common';
import { SocketForUserInject } from './document-socket.type';
import { constants } from '../../../../common/constants';
import { FileStructurePublicShareService } from '../../../file-structure-public-share/file-structure-public-share.service';
import { CollabRedis } from '../../redis';
import { absUserContentPath } from '../../../file-structure/file-structure.helper';
import { fsCustom } from '../../../../common/helper';
import { FileStructureService } from '../../../file-structure/file-structure.service';

@Injectable()
export class DocumentSocketService {
  /**
   * @description This variable is only reference to actual document socket gateway server namespace
   */
  public wss: Namespace;

  constructor(
    @InjectRedis()
    private readonly redis: Redis,

    private readonly collabRedis: CollabRedis,
    private readonly fsService: FileStructureService,
    private readonly fsPublicShareService: FileStructurePublicShareService,
  ) {}

  async setLock(client: SocketForUserInject) {
    const lockKeyName = constants.redis.buildFSLockName(client.handshake.auth.filesStructureId);

    await this.redis.set(
      // expire after 2 day if something happens
      // also this will override if there is dangling key in redis
      lockKeyName,
      client.handshake.accessTokenPayload.userId,
      'EX',
      constants.redis.twoDayInSec,
    );
  }

  async removeLock(client: SocketForUserInject) {
    const lockKeyName = constants.redis.buildFSLockName(client.handshake.auth.filesStructureId);

    await this.redis.del(lockKeyName);
  }

  async checkSharing(client: SocketForUserInject, isFsPublicShareEnabled: boolean) {
    if (!isFsPublicShareEnabled) {
      return;
    }

    const fsPublicShare = await this.fsPublicShareService.getBy({
      fileStructureId: client.handshake.auth.filesStructureId,
      userId: client.handshake.accessTokenPayload.userId,
    });

    if (fsPublicShare.isDisabled) {
      return;
    }

    const fsCollabKeyName = constants.redis.buildFSCollabName(fsPublicShare.fileStructure.sharedUniqueHash);

    //! Exists must be before setting masterSocketId
    const exists = await this.redis.exists(fsCollabKeyName);

    await this.redis.hset(fsCollabKeyName, 'masterSocketId', client.id); // update socket id

    if (!exists) {
      const sourceContentPath = path.join(
        absUserContentPath(client.handshake.user.uuid),
        fsPublicShare.fileStructure.path,
      );

      const documentText = await fsCustom.readFile(sourceContentPath).catch(() => {
        throw new BadRequestException('File not found');
      });

      // create hash table
      await this.collabRedis.createFsCollabHashTable(fsCollabKeyName, {
        doc: documentText,
        masterSocketId: client.id,
        masterUserId: client.handshake.accessTokenPayload.userId,
        servants: [],
        updates: [],
      });
    } else {
      // notify everyone the join
      const servants = await this.collabRedis.getServants(fsCollabKeyName);

      for (const socketId of servants) {
        this.wss.to(socketId).emit(constants.socket.events.UserJoined, { socketId: client.id });
      }
    }
  }

  async saveFileStructure(
    client: SocketForUserInject,
    props: { fsCollabKeyName: string; fsId: number },
  ): Promise<void> {
    const { fsId, fsCollabKeyName } = props;

    const text = await this.redis.hget(fsCollabKeyName, 'doc');

    if (!text) {
      return;
    }

    await this.fsService.replaceText(
      fsId,
      { text },
      { user: { id: client.handshake.accessTokenPayload.userId, uuid: client.handshake.user.uuid } },
    );
  }

  async getDisconnectParams(
    client: SocketForUserInject,
  ): Promise<{ activeServants: string[]; fsCollabKeyName: string; fsId: number }> {
    const fsId: number = client.handshake.auth?.filesStructureId;

    // This should not happend if happens then just disconnect
    if (!fsId) {
      throw new BadRequestException('Missing filesStructureId or userId');
    }

    const fs = await this.fsService.getById({ user: { id: client.handshake.accessTokenPayload.userId } }, fsId);
    const fsCollabKeyName = constants.redis.buildFSCollabName(fs.sharedUniqueHash);
    const servants = await this.collabRedis.getServants(fsCollabKeyName);

    return {
      fsId,
      fsCollabKeyName,
      activeServants: servants,
    };
  }

  async removeDanglingPublicShareKeys(client: SocketForUserInject): Promise<void> {
    const fsPublicShares = await this.fsPublicShareService.getManyForSocketUser({
      userId: client.handshake.accessTokenPayload.userId,
    });

    for (const fsPublicShare of fsPublicShares) {
      // ignore if disabled
      if (fsPublicShare.isDisabled) {
        continue;
      }

      const fsCollabKeyName = constants.redis.buildFSCollabName(fsPublicShare.fileStructure.sharedUniqueHash);

      const exists = await this.redis.exists(fsCollabKeyName);

      // ignore is redis key does not exist
      if (!exists) {
        continue;
      }

      const servants = await this.collabRedis.getServants(fsCollabKeyName);

      // ignore if there is at least one servant
      if (servants.length) {
        continue;
      }

      await this.redis.del(fsCollabKeyName);
    }
  }
}
