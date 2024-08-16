import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { FileStructurePublicShare } from '@prisma/client';
import { FileStructurePublicShareRepository } from './file-structure-public-share.repository';
import { FileStructureService } from '../file-structure/file-structure.service';
import { CreateOrIgnoreFsPublicShareDto } from './dto/create-or-ignore-fs-public-share.dto';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { AuthPayloadType } from '../../model/auth.types';
import { random } from '../../common/random';

@Injectable()
export class FileStructurePublicShareService {
  private readonly logger = new Logger(FileStructurePublicShareService.name);

  constructor(
    private readonly fsPublicShareRepository: FileStructurePublicShareRepository,
    private readonly fsService: FileStructureService,
  ) {}

  async createOrIgnore(
    authPayload: AuthPayloadType,
    dto: CreateOrIgnoreFsPublicShareDto,
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
}
