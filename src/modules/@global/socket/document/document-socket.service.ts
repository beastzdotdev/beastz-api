import path from 'path';
import Redis from 'ioredis';
import { Namespace } from 'socket.io';
import { InjectRedis } from '@nestjs-modules/ioredis';

import { BadRequestException, Injectable } from '@nestjs/common';
import { DocumentSocket } from './document-socket.type';
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

  async setLock(socket: DocumentSocket) {
    if (socket.handshake.isServant) {
      //TODO for servant continue
      console.log('is servant');
      return;
    }

    const lockKeyName = constants.redis.buildFSLockName(socket.handshake.auth.filesStructureId);

    await this.redis.set(
      // expire after 2 day if something happens
      // also this will override if there is dangling key in redis
      lockKeyName,
      socket.id,
      'EX',
      constants.redis.twoDayInSec,
    );
  }

  async removeLock(socket: DocumentSocket) {
    if (socket.handshake.isServant) {
      //TODO for servant continue
      console.log('is servant');
      return;
    }

    const lockKeyName = constants.redis.buildFSLockName(socket.handshake.auth.filesStructureId);
    await this.redis.del(lockKeyName);
  }

  async checkSharing(socket: DocumentSocket) {
    if (socket.handshake.isServant) {
      //TODO for servant continue
      console.log('is servant');
      return;
    }

    const { enabled } = await this.fsPublicShareService.isEnabled(
      { user: { id: socket.handshake.accessTokenPayload.userId } },
      socket.handshake.auth.filesStructureId,
    );

    if (!enabled) {
      return;
    }

    const fsPublicShare = await this.fsPublicShareService.getBy({
      fileStructureId: socket.handshake.auth.filesStructureId,
      userId: socket.handshake.accessTokenPayload.userId,
    });

    const fsCollabKeyName = constants.redis.buildFSCollabName(fsPublicShare.fileStructure.sharedUniqueHash);

    //! Exists must be before setting masterSocketId
    const exists = await this.redis.exists(fsCollabKeyName);

    if (!exists) {
      const sourceContentPath = path.join(
        absUserContentPath(socket.handshake.user.uuid),
        fsPublicShare.fileStructure.path,
      );

      const documentText = await fsCustom.readFile(sourceContentPath).catch(() => {
        throw new BadRequestException('File not found');
      });

      // create hash table
      await this.collabRedis.createFsCollabHashTable(fsCollabKeyName, {
        doc: documentText,
        masterSocketId: socket.id,
        masterUserId: socket.handshake.accessTokenPayload.userId,
        servants: [],
        updates: [],
      });
    } else {
      // update socket id
      await this.redis.hset(fsCollabKeyName, 'masterSocketId', socket.id);
    }

    // notify everyone the join
    const servants = await this.collabRedis.getServants(fsCollabKeyName);

    for (const socketId of servants) {
      this.wss.to(socketId).emit(constants.socket.events.UserJoined, { socketId: socket.id });
    }
  }

  async saveFileStructure(socket: DocumentSocket, props: { fsCollabKeyName: string; fsId: number }): Promise<void> {
    if (socket.handshake.isServant) {
      //TODO for servant continue
      console.log('is servant');
      return;
    }

    const { fsId, fsCollabKeyName } = props;

    const text = await this.redis.hget(fsCollabKeyName, 'doc');

    if (!text) {
      return;
    }

    await this.fsService.replaceText(
      fsId,
      { text },
      { user: { id: socket.handshake.accessTokenPayload.userId, uuid: socket.handshake.user.uuid } },
    );
  }

  async getDisconnectParams(
    socket: DocumentSocket,
  ): Promise<{ activeServants: string[]; fsCollabKeyName: string; fsId: number }> {
    if (socket.handshake.isServant) {
      //TODO for servant continue
      console.log('is servant');
      return {
        activeServants: [],
        fsCollabKeyName: '',
        fsId: 0,
      };
    }

    const fsId: number = socket.handshake.auth?.filesStructureId;

    // This should not happend if happens then just disconnect
    if (!fsId) {
      throw new BadRequestException('Missing filesStructureId or userId');
    }

    const fs = await this.fsService.getById({ user: { id: socket.handshake.accessTokenPayload.userId } }, fsId);
    const { fsCollabKeyName, servants } = await this.getServantsBySharedUniqueHash(fs.sharedUniqueHash);

    return {
      fsId,
      fsCollabKeyName,
      activeServants: servants,
    };
  }

  async getServantsBySharedUniqueHash(
    sharedUniqueHash: string,
  ): Promise<{ fsCollabKeyName: string; servants: string[] }> {
    const fsCollabKeyName = constants.redis.buildFSCollabName(sharedUniqueHash);
    const servants = await this.collabRedis.getServants(fsCollabKeyName);

    return {
      servants,
      fsCollabKeyName,
    };
  }
}
