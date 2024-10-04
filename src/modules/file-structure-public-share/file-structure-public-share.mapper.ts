import { Injectable } from '@nestjs/common';
import { FileStructurePublicShare } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
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

  async map(authPayload: AuthPayloadType, data: FileStructurePublicShare): Promise<FsPublicShareResponseDto> {
    const {
      sharedUniqueHash,
      title,
      mimeType,
      id: fsId,
    } = await this.fileStructureService.getByIdSelect(authPayload, data.fileStructureId, {
      sharedUniqueHash: true,
      title: true,
      mimeType: true,
      id: true,
    });

    return FsPublicShareResponseDto.map(data, { sharedUniqueHash, title, mimeType, fsId });
  }

  async mapOrNull(
    authPayload: AuthPayloadType,
    data: FileStructurePublicShare | null,
  ): Promise<FsPublicShareResponseDto | null> {
    if (!data) {
      return null;
    }

    return this.map(authPayload, data);
  }

  //TODO test out or dump
  async amap<T>(authPayload: AuthPayloadType, data: T): Promise<T extends null ? null : FsPublicShareResponseDto> {
    // Handle case where data is null, only when T is true (nullable case)
    if (data === null) {
      return null as T extends true ? FsPublicShareResponseDto | null : never;
    }

    const {
      sharedUniqueHash,
      title,
      mimeType,
      id: fsId,
    } = await this.fileStructureService.getByIdSelect(authPayload, data.fileStructureId, {
      sharedUniqueHash: true,
      title: true,
      mimeType: true,
      id: true,
    });

    return FsPublicShareResponseDto.map(data, { sharedUniqueHash, title, mimeType, fsId }) as T extends true
      ? FsPublicShareResponseDto | null
      : FsPublicShareResponseDto;
  }
}
