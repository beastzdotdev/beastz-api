import { PrismaTx } from '@global/prisma';
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
    tx?: PrismaTx,
  ): Promise<FileStructurePublicShare> {
    const { fileStructureId } = queryParams;

    const fsPublicShare = await this.fsPublicShareRepository.getBy(
      {
        userId: authPayload.user.id,
        fileStructureId,
      },
      tx,
    );

    if (!fsPublicShare) {
      throw new NotFoundException();
    }

    return fsPublicShare;
  }
}
