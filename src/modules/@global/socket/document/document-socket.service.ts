import path from 'path';
import Redis from 'ioredis';
import { Namespace } from 'socket.io';
import { InjectRedis } from '@nestjs-modules/ioredis';

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SocketForUserInject } from './document-socket.type';
import { constants } from '../../../../common/constants';
import { FileStructurePublicShareService } from '../../../file-structure-public-share/file-structure-public-share.service';
import { CollabRedis } from '../../redis';
import { absUserContentPath } from '../../../file-structure/file-structure.helper';
import { fsCustom } from '../../../../common/helper';
import { FileStructureService } from '../../../file-structure/file-structure.service';
import { FsPublicSharePureService } from '../../../file-structure-public-share/fs-public-share-pure.service';

@Injectable()
export class DocumentSocketService {
  /**
   * @description This variable is only reference to actual document socket gateway server namespace
   */
  public wss: Namespace;
  private readonly logger = new Logger(DocumentSocketService.name);

  constructor(
    @InjectRedis()
    private readonly redis: Redis,

    private readonly collabRedis: CollabRedis,
    private readonly fsService: FileStructureService,
    private readonly fsPublicShareService: FileStructurePublicShareService,
    private readonly fsPublicSharePureService: FsPublicSharePureService,
  ) {}

  async setLock(client: SocketForUserInject) {
    const fsId: number = client.handshake.auth?.filesStructureId;
    const userId = client.handshake?.accessTokenPayload?.userId;

    // This should not happend
    if (!fsId || !userId) {
      throw new BadRequestException('Missing filesStructureId or userId');
    }

    const lockKeyName = constants.redis.buildFSLockName(fsId);

    // expire after 2 day if something happens
    // also this will override if there is dangling key in redis
    await this.redis.set(lockKeyName, userId, 'EX', constants.redis.twoDayInSec);
  }

  async removeLock(client: SocketForUserInject) {
    const fsId: number = client.handshake.auth?.filesStructureId;

    // This should not happend if happens then just disconnect
    if (!fsId) {
      throw new BadRequestException('Missing filesStructureId or userId');
    }

    const lockKeyName = constants.redis.buildFSLockName(fsId);

    await this.redis.del(lockKeyName);
  }

  async checkSharing(client: SocketForUserInject) {
    const fsPublicShares = await this.fsPublicShareService.getManyForSocketUser({
      userId: client.handshake.accessTokenPayload.userId,
    });

    for (const fsPublicShare of fsPublicShares) {
      // ignore if disabled
      if (fsPublicShare.isDisabled) {
        continue;
      }

      const fsCollabKeyName = constants.redis.buildFSCollabName(fsPublicShare.uniqueHash);

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
          this.wss.to(socketId).emit('user-join', { socketId: client.id });
        }
      }
    }
  }

  async saveFileStructure(client: SocketForUserInject, props: { key: string; fsId: number }) {
    const { fsId, key } = props;
    const text = (await this.redis.hget(key, 'doc')) ?? '';

    await this.fsService.replaceText(
      fsId,
      { text },
      { user: { id: client.handshake.accessTokenPayload.userId, uuid: client.handshake.user.uuid } },
    );
  }

  async getDisconnectParams(
    client: SocketForUserInject,
  ): Promise<{ activeServants: string[]; key: string; fsId: number }> {
    const fsId: number = client.handshake.auth?.filesStructureId;

    // This should not happend if happens then just disconnect
    if (!fsId) {
      throw new BadRequestException('Missing filesStructureId or userId');
    }

    const fsPublicShare = await this.fsPublicSharePureService.getBy(
      { user: { id: client.handshake.accessTokenPayload.userId } },
      { fileStructureId: fsId },
    );

    const fsCollabKeyName = constants.redis.buildFSCollabName(fsPublicShare.uniqueHash);
    const servants = await this.collabRedis.getServants(fsCollabKeyName);

    return {
      fsId,
      key: fsCollabKeyName,
      activeServants: servants,
    };
  }
}
