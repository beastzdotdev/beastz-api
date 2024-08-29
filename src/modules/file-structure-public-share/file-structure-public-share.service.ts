import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FileStructurePublicShare } from '@prisma/client';
import { FileStructurePublicShareRepository } from './file-structure-public-share.repository';
import { FileStructureService } from '../file-structure/file-structure.service';
import { FsPublicShareCreateOrIgnoreDto } from './dto/fs-public-share-create-or-ignore.dto';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { AuthPayloadType } from '../../model/auth.types';
import { random } from '../../common/random';
import { FsPublishShareGetByQueryDto } from './dto/fs-publish-share-get-by-query.dto';
import { FsPublicShareUpdateByIdDto } from './dto/fs-public-share-update-by-id.dto';

@Injectable()
export class FileStructurePublicShareService {
  private readonly logger = new Logger(FileStructurePublicShareService.name);

  constructor(
    private readonly fsPublicShareRepository: FileStructurePublicShareRepository,
    private readonly fsService: FileStructureService,
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

  async createOrIgnore(
    authPayload: AuthPayloadType,
    dto: FsPublicShareCreateOrIgnoreDto,
    tx: PrismaTx,
  ): Promise<FileStructurePublicShare> {
    const { fileStructureId } = dto;

    const fs = await this.fsService.getById(authPayload, fileStructureId, tx);

    if (fs.isInBin || fs.isEncrypted || !fs.isFile || fs.isInBin || fs.isLocked || fs.isShortcut) {
      this.logger.debug(`File structure ${fileStructureId} is not public shareable`, fs);
      throw new BadRequestException('File cannot be shared');
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

    return this.fsPublicShareRepository.create(
      {
        userId: authPayload.user.id,
        fileStructureId,
        uniqueHash,
      },
      tx,
    );
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

    return updateResult;
  }
}
