import { Injectable } from '@nestjs/common';
import { FileStructure } from '@prisma/client';
import { PrismaService } from '../@global/prisma/prisma.service';
import { PrismaTx } from '../@global/prisma/prisma.type';
import {
  CreateFileStructureParams,
  GetByMethodParamsInRepo,
  GetManyByMethodParamsInRepo,
  UpdateFSParams,
} from './file-structure.type';

@Injectable()
export class FileStructureRepository {
  constructor(private readonly prismaService: PrismaService) {}

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

    const { depth, isFile, title, userId, path, parentId } = params;

    if (!Object.values(params).length) {
      return null;
    }

    return db.fileStructure.findFirst({
      where: {
        depth,
        isFile,
        userId,
        title,
        path,
        parentId,
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

  async updateById(
    id: number,
    data: UpdateFSParams,
    params: { userId: number; isInBin?: boolean },
    tx?: PrismaTx,
  ): Promise<void> {
    const db = tx ?? this.prismaService;
    const { userId, isInBin } = params;

    await db.fileStructure.updateMany({
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
}
