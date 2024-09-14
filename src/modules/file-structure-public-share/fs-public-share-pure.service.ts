import { Injectable, NotFoundException } from '@nestjs/common';
import { FileStructurePublicShare } from '@prisma/client';
import { FileStructurePublicShareRepository } from './file-structure-public-share.repository';
import { AuthPayloadType } from '../../model/auth.types';
import { FsPublishShareGetByQueryDto } from './dto/fs-publish-share-get-by-query.dto';

@Injectable()
export class FsPublicSharePureService {
  constructor(private readonly fsPublicShareRepository: FileStructurePublicShareRepository) {}

  async getBy(
    authPayload: AuthPayloadType | { user: { id: number } },
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
}
