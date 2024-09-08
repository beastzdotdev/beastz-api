import { Redis } from 'ioredis';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FileStructurePublicShare } from '@prisma/client';
import { InjectRedis } from '@nestjs-modules/ioredis';
import path from 'path';
import { PrismaTx } from '@global/prisma';
import { CollabRedis } from '@global/redis';
import { FileStructurePublicShareRepository } from './file-structure-public-share.repository';
import { FileStructureService } from '../file-structure/file-structure.service';
import { FsPublicShareCreateOrIgnoreDto } from './dto/fs-public-share-create-or-ignore.dto';
import { AuthPayloadType } from '../../model/auth.types';
import { random } from '../../common/random';
import { FsPublishShareGetByQueryDto } from './dto/fs-publish-share-get-by-query.dto';
import { FsPublicShareUpdateByIdDto } from './dto/fs-public-share-update-by-id.dto';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { constants } from '../../common/constants';
import { fsCustom } from '../../common/helper';
import { absUserContentPath } from '../file-structure/file-structure.helper';

@Injectable()
export class FileStructurePublicShareService {
  private readonly logger = new Logger(FileStructurePublicShareService.name);

  constructor(
    @InjectRedis()
    private readonly redis: Redis,

    private readonly fsPublicShareRepository: FileStructurePublicShareRepository,
    private readonly fsService: FileStructureService,

    private readonly collabRedis: CollabRedis,
  ) {}

  async getBy(
    authPayload: AuthPayloadType,
    queryParams: FsPublishShareGetByQueryDto,
  ): Promise<FileStructurePublicShare> {
    const { uniqueHash, fileStructureId } = queryParams;

    const fsPublicShare = await this.fsPublicShareRepository.getBy({
      uniqueHash,
      userId: authPayload.user.id,
      fileStructureId,
    });

    if (!fsPublicShare) {
      throw new NotFoundException();
    }

    return fsPublicShare;
  }

  async getManyForSocketUser(params: { userId: number }): Promise<FileStructurePublicShare[]> {
    const { userId } = params;

    return this.fsPublicShareRepository.getManyBy({
      userId,
    });
  }

  async createOrIgnore(
    authPayload: AuthPayloadType,
    dto: FsPublicShareCreateOrIgnoreDto,
    tx: PrismaTx,
  ): Promise<FileStructurePublicShare> {
    const { fileStructureId } = dto;

    const fs = await this.fsService.getById(authPayload, fileStructureId, tx);

    if (fs.isInBin || fs.isEncrypted || !fs.isFile || fs.isInBin || fs.isLocked || fs.isShortcut) {
      this.logger.debug(`File structure ${fileStructureId} is not public shareable`, fs);
      throw new BadRequestException(ExceptionMessageCode.DOCUMENT_NOT_SHAREABLE);
    }

    const fsPublicShare = await this.fsPublicShareRepository.getBy(
      {
        fileStructureId,
        userId: authPayload.user.id,
      },
      tx,
    );

    if (fsPublicShare) {
      return fsPublicShare;
    }

    const uniqueHash = random.getRandomString(16);
    const fsPublicShareCreated = await this.fsPublicShareRepository.create(
      {
        userId: authPayload.user.id,
        fileStructureId,
        uniqueHash,
      },
      tx,
    );

    const fsCollabKeyName = constants.redis.buildFSCollabName(uniqueHash);

    const sourceContentPath = path.join(absUserContentPath(authPayload.user.uuid), fs.path);
    const text = await fsCustom.readFile(sourceContentPath).catch(() => {
      throw new BadRequestException('File not found');
    });

    // master socket id must be updated in handleConnection
    await this.collabRedis.createFsCollabHashTable(fsCollabKeyName, {
      doc: text,
      masterSocketId: null,
      masterUserId: authPayload.user.id,
      servants: [],
      updates: [],
    });

    return fsPublicShareCreated;
  }

  async updateById(
    authPayload: AuthPayloadType,
    id: number,
    dto: FsPublicShareUpdateByIdDto,
    tx?: PrismaTx,
  ): Promise<FileStructurePublicShare> {
    const { isDisabled } = dto;

    const updateResult = await this.fsPublicShareRepository.updateById(
      authPayload,
      id,
      {
        isDisabled,
      },
      tx,
    );

    if (!updateResult) {
      throw new NotFoundException();
    }

    const fs = await this.fsService.getById(authPayload, updateResult.fileStructureId, tx);

    if (fs.isInBin || fs.isEncrypted || !fs.isFile || fs.isInBin || fs.isLocked || fs.isShortcut) {
      this.logger.debug(`File structure ${updateResult.fileStructureId} is not public shareable`, fs);
      throw new BadRequestException(ExceptionMessageCode.DOCUMENT_NOT_SHAREABLE);
    }

    const fsCollabKeyName = constants.redis.buildFSCollabName(updateResult.uniqueHash);
    const servants = await this.collabRedis.getServants(fsCollabKeyName);

    if (isDisabled) {
      // notify socket users by uniqueHash
      for (const socketId of servants) {
        //TODO resolve here dependency issue !!!
        // this.documentSocketGateway.notifySocketOnRoot(socketId, 'collab-ended', {
        //   uniqueHash: updateResult.uniqueHash,
        // });
      }

      await this.redis.del(fsCollabKeyName);
    } else {
      const sourceContentPath = path.join(absUserContentPath(authPayload.user.uuid), fs.path);

      const text = await fsCustom.readFile(sourceContentPath).catch(() => {
        throw new BadRequestException('File not found');
      });

      await this.collabRedis.createFsCollabHashTable(fsCollabKeyName, {
        doc: text,
        masterSocketId: null,
        masterUserId: authPayload.user.id,
        servants,
        updates: [],
      });
    }

    return updateResult;
  }
}
