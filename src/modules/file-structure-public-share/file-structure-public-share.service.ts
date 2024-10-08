import { Redis } from 'ioredis';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FileStructure, FileStructurePublicShare } from '@prisma/client';
import { InjectRedis } from '@nestjs-modules/ioredis';
import path from 'path';
import { PrismaTx } from '@global/prisma';
import { CollabRedis } from '@global/redis';
import { EventEmitterService } from '@global/event-emitter';
import { FileStructurePublicShareRepository } from './file-structure-public-share.repository';
import { FileStructureService } from '../file-structure/file-structure.service';
import { FsPublicShareCreateOrIgnoreDto } from './dto/fs-public-share-create-or-ignore.dto';
import { AuthPayloadType } from '../../model/auth.types';
import { random } from '../../common/random';
import { FsPublicShareUpdateByIdDto } from './dto/fs-public-share-update-by-id.dto';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { constants } from '../../common/constants';
import { fsCustom } from '../../common/helper';
import { absUserContentPath } from '../file-structure/file-structure.helper';
import {
  FsPublicShareForSocketUser,
  FsPublicShareWithRelations,
  GetByMethodParamsInFsPublicShare,
} from './file-structure-public-share.type';
import { FsPublicSharePublicActiveParticipantQueryDto } from './dto/fs-public-share-public-active-participant-query.dto';

@Injectable()
export class FileStructurePublicShareService {
  private readonly logger = new Logger(FileStructurePublicShareService.name);

  constructor(
    @InjectRedis()
    private readonly redis: Redis,

    private readonly fsPublicShareRepository: FileStructurePublicShareRepository,
    private readonly fsService: FileStructureService,

    private readonly collabRedis: CollabRedis,
    private readonly eventEmitter: EventEmitterService,
  ) {}

  async getById(id: number, params: { userId: number }): Promise<FileStructurePublicShare> {
    const result = await this.fsPublicShareRepository.getById(id, { userId: params.userId });

    if (!result) {
      throw new NotFoundException(ExceptionMessageCode.FS_PUBLIC_SHARE_NOT_FOUND);
    }

    return result;
  }

  async getBy(params: GetByMethodParamsInFsPublicShare, tx?: PrismaTx): Promise<FsPublicShareWithRelations> {
    const result = await this.fsPublicShareRepository.getBy(params, tx);

    if (!result) {
      throw new NotFoundException(ExceptionMessageCode.FS_PUBLIC_SHARE_NOT_FOUND);
    }

    return result;
  }

  async getManyForSocketUser(params: { userId: number }): Promise<FsPublicShareForSocketUser[]> {
    const { userId } = params;

    return this.fsPublicShareRepository.getManyForSocketUser(userId);
  }

  async create(
    authPayload: AuthPayloadType,
    dto: FsPublicShareCreateOrIgnoreDto,
    tx: PrismaTx,
  ): Promise<FileStructurePublicShare> {
    const { fileStructureId } = dto;

    const userActiveSessionSocketId = await this.redis.get(constants.redis.buildUserIdName(authPayload.user.id));

    if (!userActiveSessionSocketId) {
      throw new BadRequestException('user is not in session');
    }

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
      throw new BadRequestException(ExceptionMessageCode.FS_PUBLICS_SHARE_EXISTS);
    }

    const uniqueHash = random.getRandomString(16);
    const fsPublicShareCreated = await this.fsPublicShareRepository.create(
      {
        userId: authPayload.user.id,
        fileStructureId,
      },
      tx,
    );

    const fsCollabKeyName = constants.redis.buildFSCollabName(uniqueHash);
    const documentText = await this.getDocumentText(authPayload, fs);

    // master socket id must be updated in handleConnection
    await this.collabRedis.createFsCollabHashTable(fsCollabKeyName, {
      doc: documentText,
      masterSocketId: userActiveSessionSocketId,
      masterUserId: authPayload.user.id,
      servants: [],
      updates: [],
    });

    // this is creation/toggle process so no need to notify servants only me !
    await this.eventEmitter.emitAsync('document.pull.doc.full', { userId: authPayload.user.id });

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

    const fsCollabKeyName = constants.redis.buildFSCollabName(fs.sharedUniqueHash);

    // if true then collab exists (here value is toggled)
    if (isDisabled) {
      const text = await this.redis.hget(fsCollabKeyName, 'doc');

      if (!text) {
        throw new BadRequestException('File not found');
      }

      const [_, activeServants] = await Promise.all([
        this.fsService.replaceText(fs.id, { text, checkEditMode: false }, authPayload, tx),
        this.collabRedis.getServants(fsCollabKeyName),
      ]);

      await Promise.all([
        this.redis.del(fsCollabKeyName),
        this.eventEmitter.emitAsync('document.pull.doc.full', { userId: authPayload.user.id }),
        this.eventEmitter.emitAsync('document.share.disabled', {
          sharedUniqueHash: fs.sharedUniqueHash,
          activeServants,
        }),
      ]);
    } else {
      const [documentText, servants] = await Promise.all([
        this.getDocumentText(authPayload, fs),
        this.collabRedis.getServants(fsCollabKeyName),
      ]);

      await this.collabRedis.createFsCollabHashTable(fsCollabKeyName, {
        doc: documentText,
        masterSocketId: null,
        masterUserId: authPayload.user.id,
        servants,
        updates: [],
      });

      // this is creation/toggle process so no need to notify servants only me !
      await this.eventEmitter.emitAsync('document.pull.doc.full', { userId: authPayload.user.id });
    }

    return updateResult;
  }

  async isEnabled(
    authPayload: AuthPayloadType | { user: { id: number } },
    fsId: number,
    tx?: PrismaTx,
  ): Promise<{ enabled: boolean; data: FileStructurePublicShare | null }> {
    const fsPublicShare = await this.fsPublicShareRepository.getBy(
      {
        userId: authPayload.user.id,
        fileStructureId: fsId,
      },
      tx,
    );

    if (!fsPublicShare) {
      return {
        enabled: false,
        data: null,
      };
    }

    return {
      enabled: !fsPublicShare.isDisabled,
      data: fsPublicShare,
    };
  }

  async isEnabledPublic(
    sharedUniqueHash: string,
  ): Promise<{ enabled: boolean; data: FileStructurePublicShare | null }> {
    const fsPublicShare = await this.fsPublicShareRepository.getBy({ sharedUniqueHash });

    if (!fsPublicShare) {
      return {
        enabled: false,
        data: null,
      };
    }

    return {
      enabled: !fsPublicShare.isDisabled,
      data: fsPublicShare,
    };
  }

  async collabActiveParticipantsPublic(
    fsId: number,
    _queryParams: FsPublicSharePublicActiveParticipantQueryDto,
  ): Promise<string[]> {
    const { sharedUniqueHash } = await this.fsService.getByIdSelect(null, fsId, { sharedUniqueHash: true });
    const fsCollabKeyName = constants.redis.buildFSCollabName(sharedUniqueHash);

    const [masterSocketId, servants] = await Promise.all([
      this.collabRedis.getMasterSocketId(fsCollabKeyName),
      this.collabRedis.getServants(fsCollabKeyName),
    ]);

    return [...(masterSocketId ? [masterSocketId] : []), ...servants];
  }

  private async getDocumentText(authPayload: AuthPayloadType, fs: FileStructure): Promise<string> {
    const sourceContentPath = path.join(absUserContentPath(authPayload.user.uuid), fs.path);
    return fsCustom.readFile(sourceContentPath).catch(() => {
      throw new BadRequestException('File not found');
    });
  }
}
