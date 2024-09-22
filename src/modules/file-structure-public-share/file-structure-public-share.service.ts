import { Redis } from 'ioredis';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FileStructure, FileStructurePublicShare } from '@prisma/client';
import { InjectRedis } from '@nestjs-modules/ioredis';
import path from 'path';
import { PrismaTx } from '@global/prisma';
import { CollabRedis } from '@global/redis';
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
      masterSocketId: null,
      masterUserId: authPayload.user.id,
      servants: [],
      updates: [],
    });

    //! Important
    //TODO ! notify sockets via event emitter

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

    if (!isDisabled) {
      await this.redis.del(fsCollabKeyName);
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
    }

    return updateResult;
  }

  async isEnabled(authPayload: AuthPayloadType | { user: { id: number } }, fsId: number): Promise<boolean> {
    const fsPublicShare = await this.fsPublicShareRepository.getBy({
      userId: authPayload.user.id,
      fileStructureId: fsId,
    });

    if (!fsPublicShare) {
      return false;
    }

    return !fsPublicShare.isDisabled;
  }

  private async getDocumentText(authPayload: AuthPayloadType, fs: FileStructure): Promise<string> {
    const sourceContentPath = path.join(absUserContentPath(authPayload.user.uuid), fs.path);
    return fsCustom.readFile(sourceContentPath).catch(() => {
      throw new BadRequestException('File not found');
    });
  }
}
