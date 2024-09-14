import { Injectable } from '@nestjs/common';
import { FileStructurePublicShare } from '@prisma/client';
import { PrismaService, PrismaTx } from '@global/prisma';
import {
  FsPublicShareForSocketUser,
  GetByMethodParamsInFsPublicShare,
  UpdateFsPublicShareParams,
} from './file-structure-public-share.type';
import { AuthPayloadType } from '../../model/auth.types';

@Injectable()
export class FileStructurePublicShareRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getBy(params: GetByMethodParamsInFsPublicShare, tx?: PrismaTx): Promise<FileStructurePublicShare | null> {
    const db = tx ?? this.prismaService;
    const { fileStructureId, uniqueHash, userId } = params;

    if (!Object.values(params).length) {
      return null;
    }

    return db.fileStructurePublicShare.findFirst({
      where: {
        fileStructureId,
        uniqueHash,
        userId,
      },
    });
  }

  async getManyBy(params: GetByMethodParamsInFsPublicShare, tx?: PrismaTx): Promise<FileStructurePublicShare[]> {
    const db = tx ?? this.prismaService;
    const { fileStructureId, uniqueHash, userId } = params;

    if (!Object.values(params).length) {
      return [];
    }

    return db.fileStructurePublicShare.findMany({
      where: {
        fileStructureId,
        uniqueHash,
        userId,
      },
    });
  }

  async getManyForSocketUser(userId: number, tx?: PrismaTx): Promise<FsPublicShareForSocketUser[]> {
    const db = tx ?? this.prismaService;

    return db.fileStructurePublicShare.findMany({
      where: {
        userId,
      },
      include: {
        fileStructure: {
          select: {
            id: true,
            path: true,
          },
        },
      },
    });
  }

  async create(
    params: { userId: number; fileStructureId: number; uniqueHash: string },
    tx?: PrismaTx,
  ): Promise<FileStructurePublicShare> {
    const db = tx ?? this.prismaService;
    const { userId, fileStructureId, uniqueHash } = params;

    return db.fileStructurePublicShare.create({
      data: {
        userId,
        fileStructureId,
        uniqueHash,
      },
    });
  }

  async updateById(
    authPayload: AuthPayloadType,
    id: number,
    params: UpdateFsPublicShareParams,
    tx: PrismaTx | undefined,
  ): Promise<FileStructurePublicShare | null> {
    const db = tx ?? this.prismaService;
    const entity = await db.fileStructurePublicShare.findUnique({ where: { id, userId: authPayload.user.id } });

    if (!entity) {
      return null;
    }

    return db.fileStructurePublicShare.update({
      where: { id, userId: authPayload.user.id },
      data: {
        ...entity,
        ...params,
      },
    });
  }
}
