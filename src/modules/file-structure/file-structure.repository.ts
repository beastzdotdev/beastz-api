import { Injectable } from '@nestjs/common';
import { FileStructure } from '@prisma/client';
import { PrismaService } from '../@global/prisma/prisma.service';
import { PrismaTx } from '../@global/prisma/prisma.type';
import {
  CreateFileStructureParams,
  ExistsByIdsReturnType,
  GetByMethodParamsInRepo,
  GetManyByMethodParamsInRepo,
  UpdateFSParams,
} from './file-structure.type';

@Injectable()
export class FileStructureRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async search(search: string, params: { userId: number }) {
    const { userId } = params;

    const response = await this.prismaService.fileStructure.findMany({
      where: {
        userId,
        isInBin: false,
        OR: [
          {
            OR: [
              { title: { contains: search } }, // Search titles for "t" or "x"
              { title: { equals: search } }, // Handle exact title matches (optional)
            ],
          },
          {
            fileExstensionRaw: { endsWith: search },
          },
        ],
      },
      take: 15,
    });

    return response;
  }

  async getById(id: number, tx?: PrismaTx): Promise<FileStructure | null> {
    const db = tx ?? this.prismaService;

    return db.fileStructure.findFirst({
      where: {
        id,
        isInBin: false,
      },
    });
  }

  async getByIdForUser(
    id: number,
    params: { userId: number; isInBin?: boolean },
    tx?: PrismaTx,
  ): Promise<FileStructure | null> {
    const db = tx ?? this.prismaService;
    const { userId, isInBin } = params;

    return db.fileStructure.findFirst({
      where: {
        id,
        userId,
        isInBin: isInBin ?? false,
      },
    });
  }

  async getTotalFilesSize(userId: number, params: { isInBin?: boolean }, tx?: PrismaTx): Promise<number> {
    const db = tx ?? this.prismaService;
    const { isInBin } = params;

    const response = await db.fileStructure.aggregate({
      where: {
        userId,
        isInBin,
      },
      _sum: {
        sizeInBytes: true,
      },
    });

    return response._sum.sizeInBytes ?? 0;
  }

  async getBy(params: GetByMethodParamsInRepo, tx?: PrismaTx): Promise<FileStructure | null> {
    const db = tx ?? this.prismaService;

    const { depth, isFile, title, userId, path, parentId, fileExstensionRaw, mimeTypeRaw } = params;

    if (!Object.values(params).length) {
      return null;
    }

    return db.fileStructure.findFirst({
      where: {
        depth,
        isFile,
        userId,
        mimeTypeRaw,
        title,
        path,
        parentId,
        fileExstensionRaw,
        isInBin: false,
      },
    });
  }

  async getManyBy(params: GetManyByMethodParamsInRepo, tx?: PrismaTx): Promise<FileStructure[]> {
    const db = tx ?? this.prismaService;

    const { depth, isFile, title, userId, titleStartsWith, parentId } = params;

    if (!Object.values(params).length) {
      return [];
    }

    return db.fileStructure.findMany({
      where: {
        depth,
        isFile,
        userId,
        parentId,
        isInBin: false,
        ...(titleStartsWith ? { title: { startsWith: titleStartsWith } } : { title }),
      },
    });
  }

  async create(params: CreateFileStructureParams, tx?: PrismaTx): Promise<FileStructure> {
    const db = tx ?? this.prismaService;

    return db.fileStructure.create({
      data: params,
    });
  }

  async existsByIds(
    ids: number[],
    params: { userId: number; isInBin?: boolean },
    tx?: PrismaTx,
  ): Promise<ExistsByIdsReturnType> {
    const db = tx ?? this.prismaService;
    const { userId, isInBin } = params;

    const foundIds = await db.fileStructure.findMany({
      where: {
        id: { in: ids },
        userId,
        isInBin: isInBin ?? false,
      },
      select: {
        id: true,
      },
    });

    const foundIDsSet = new Set(foundIds.map(e => e.id));
    const notFoundIDs = ids.filter(id => !foundIDsSet.has(id));

    return {
      allIdsExist: notFoundIDs.length === 0,
      notFoundIds: notFoundIDs,
    };
  }

  async updateById(
    id: number,
    data: UpdateFSParams,
    params: { userId: number; isInBin?: boolean },
    tx?: PrismaTx,
  ): Promise<FileStructure> {
    const db = tx ?? this.prismaService;
    const { userId, isInBin } = params;

    return db.fileStructure.update({
      where: {
        id,
        userId,
        isInBin: isInBin ?? false,
      },
      data,
    });
  }

  async updateByIdAndReturn(
    id: number,
    params: { userId: number; isInBin?: boolean },
    data: UpdateFSParams,
    tx?: PrismaTx,
  ): Promise<FileStructure> {
    const db = tx ?? this.prismaService;
    const { userId, isInBin } = params;

    return db.fileStructure.update({
      where: {
        id,
        userId,
        isInBin: isInBin ?? false,
      },
      data,
    });
  }

  async deleteById(id: number, params: { userId: number; isInBin?: boolean }, tx?: PrismaTx): Promise<FileStructure> {
    const db = tx ?? this.prismaService;
    const { userId, isInBin } = params;

    return db.fileStructure.delete({
      where: {
        id,
        userId,
        isInBin: isInBin ?? false,
      },
    });
  }

  async getByPathUnderDir(
    parentId: number | null,
    newPath: string,
    userId: number,
    tx?: PrismaTx,
  ): Promise<{ id: number } | null> {
    const db = tx ?? this.prismaService;

    return db.fileStructure.findFirst({
      select: {
        id: true,
      },
      where: {
        parentId,
        path: newPath,
        isInBin: false,
        userId,
      },
    });
  }

  async rootParentChildrenCountCheck(rootParentId: number, userId: number, tx?: PrismaTx): Promise<number> {
    const db = tx ?? this.prismaService;

    return db.fileStructure.count({
      where: {
        userId,
        rootParentId,
        isInBin: false,
      },
    });
  }

  async getByIdsForUser(
    ids: number[],
    params: { userId: number; isInBin?: boolean },
    tx?: PrismaTx,
  ): Promise<FileStructure[]> {
    const db = tx ?? this.prismaService;
    const { userId, isInBin } = params;

    return db.fileStructure.findMany({
      where: {
        id: { in: ids },
        userId,
        isInBin: isInBin ?? false,
      },
    });
  }
}
