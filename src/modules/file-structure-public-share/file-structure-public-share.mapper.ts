import { Injectable } from '@nestjs/common';
import { FileStructurePublicShare } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaTx } from '@global/prisma';
import { FileStructureService } from '../file-structure/file-structure.service';
import { AuthPayloadType } from '../../model/auth.types';
import { FsPublicShareResponseDto } from './dto/response/fs-public-share-response.dto';
import { PublicFsPublicShareResponseDto } from './dto/response/public-fs-public-share-response.dto';

@Injectable()
export class FileStructurePublicShareMapper {
  constructor(private readonly fileStructureService: FileStructureService) {}

  mapPublic(data: FileStructurePublicShare | null): PublicFsPublicShareResponseDto | null {
    if (!data) {
      return null;
    }

    return plainToInstance(PublicFsPublicShareResponseDto, data);
  }

  async map<T extends FileStructurePublicShare | null>(
    authPayload: AuthPayloadType,
    data: T,
    tx?: PrismaTx,
  ): Promise<T extends null ? null : FsPublicShareResponseDto> {
    if (data === null) {
      return null as T extends null ? null : never;
    }

    const {
      sharedUniqueHash,
      title,
      mimeType,
      id: fsId,
    } = await this.fileStructureService.getByIdSelect(
      authPayload,
      data.fileStructureId,
      {
        sharedUniqueHash: true,
        title: true,
        mimeType: true,
        id: true,
      },
      tx,
    );

    return FsPublicShareResponseDto.map(data, { sharedUniqueHash, title, mimeType, fsId }) as T extends null
      ? null
      : FsPublicShareResponseDto;
  }
}
