import { Injectable } from '@nestjs/common';
import { FileStructurePublicShare } from '@prisma/client';
import { PrismaService, PrismaTx } from '@global/prisma';
import {
  FsPublicShareForSocketUser,
  FsPublicShareWithRelations,
  GetByMethodParamsInFsPublicShare,
  UpdateFsPublicShareParams,
} from './file-structure-public-share.type';
import { AuthPayloadType } from '../../model/auth.types';

@Injectable()
export class FileStructurePublicShareRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getById(id: number, params: { userId: number }, tx?: PrismaTx): Promise<FileStructurePublicShare | null> {
    const db = tx ?? this.prismaService;
    const { userId } = params;

    return db.fileStructurePublicShare.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async getBy(params: GetByMethodParamsInFsPublicShare, tx?: PrismaTx): Promise<FsPublicShareWithRelations | null> {
    const db = tx ?? this.prismaService;
    const { fileStructureId, userId } = params;

    if (!Object.values(params).length) {
      return null;
    }

    return db.fileStructurePublicShare.findFirst({
      where: {
        fileStructureId,
        userId,
      },
      relationLoadStrategy: 'join',
      include: {
        fileStructure: true,
      },
    });
  }

  async getManyBy(params: GetByMethodParamsInFsPublicShare, tx?: PrismaTx): Promise<FileStructurePublicShare[]> {
    const db = tx ?? this.prismaService;
    const { fileStructureId, userId } = params;

    if (!Object.values(params).length) {
      return [];
    }

    return db.fileStructurePublicShare.findMany({
      where: {
        fileStructureId,
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
            sharedUniqueHash: true,
          },
        },
      },
    });
  }

  async create(params: { userId: number; fileStructureId: number }, tx?: PrismaTx): Promise<FileStructurePublicShare> {
    const db = tx ?? this.prismaService;
    const { userId, fileStructureId } = params;

    return db.fileStructurePublicShare.create({
      data: {
        userId,
        fileStructureId,
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
