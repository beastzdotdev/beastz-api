import { Injectable } from '@nestjs/common';
import { FileStructure, Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../@global/prisma/prisma.service';
import { PrismaTx } from '../@global/prisma/prisma.type';
import {
  CreateFileStructureParams,
  GetByMethodParamsInRepo,
  GetManyByMethodParamsInRepo,
  UpdateFSParams,
} from './file-structure.type';
import { FileStructureFromRaw } from './model/file-structure-from-raw';

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

  async getByIdForUser(id: number, userId: number, tx?: PrismaTx): Promise<FileStructure | null> {
    const db = tx ?? this.prismaService;

    return db.fileStructure.findFirst({
      where: {
        id,
        userId,
        isInBin: false,
      },
    });
  }

  async getTotalFilesSize(userId: number, tx?: PrismaTx): Promise<number> {
    const db = tx ?? this.prismaService;

    const response = await db.fileStructure.aggregate({
      where: {
        userId,
        isInBin: false,
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

  async recursiveSelect(
    params: {
      userId: number;
      parentId?: number | null;
      id?: number;
      depth?: number;
      inBin?: boolean;
    },
    tx?: PrismaTx,
  ): Promise<FileStructureFromRaw[]> {
    const db = tx ?? this.prismaService;

    const { id, userId, depth, parentId, inBin } = params;

    let rootParentIdCheck: Prisma.Sql = Prisma.empty; // parentId null here means null check in db

    // only check for undefined not null
    if (parentId !== undefined) {
      rootParentIdCheck =
        parentId === null ? Prisma.sql` and parent_id is null ` : Prisma.sql` and parent_id = ${parentId} `;
    }

    let recursiveDepthCheck: Prisma.Sql = Prisma.empty;

    // only check for undefined not null
    if (depth !== undefined) {
      recursiveDepthCheck = Prisma.sql` and fs.depth <= ${depth} `;
    }

    let idCheck: Prisma.Sql = Prisma.empty;

    // only check for undefined not null
    if (id !== undefined) {
      idCheck = Prisma.sql` and fs.id = ${id} `;
    }

    const d = await db.$queryRaw<unknown[]>(Prisma.sql`
      WITH RECURSIVE AllAncestors AS (
        SELECT *
        FROM file_structure
        WHERE user_id = ${userId}
        ${inBin ? Prisma.sql` and is_in_bin = true ` : Prisma.sql` and is_in_bin = false `}
        ${rootParentIdCheck}
        ${idCheck}

        UNION ALL

        SELECT fs.*
        FROM file_structure fs
            JOIN AllAncestors p ON fs.parent_id = p.id
        where fs.id <> p.id
          ${inBin ? Prisma.sql` and fs.is_in_bin = true ` : Prisma.sql` and fs.is_in_bin = false `}
          and fs.user_id = ${userId}
          ${recursiveDepthCheck}
      )
      SELECT distinct * FROM AllAncestors;
    `);

    return plainToInstance(FileStructureFromRaw, d, { exposeDefaultValues: true });
  }

  async create(params: CreateFileStructureParams, tx?: PrismaTx): Promise<FileStructure> {
    const db = tx ?? this.prismaService;

    return db.fileStructure.create({
      data: params,
    });
  }

  async recursiveDelete(id: number, tx?: PrismaTx): Promise<number> {
    const db = tx ?? this.prismaService;

    const d = await db.$executeRaw(Prisma.sql`
      WITH RECURSIVE AllAncestors AS (
        SELECT id, parent_id 
        FROM file_structure 
        WHERE id = ${id} and is_in_bin = false
    
        UNION ALL
    
        SELECT fs.id, fs.parent_id 
        FROM file_structure fs 
          JOIN AllAncestors p ON fs.parent_id = p.id
        WHERE fs.id <> p.id and is_in_bin = false
      )
        DELETE FROM file_structure WHERE id IN (SELECT id FROM AllAncestors);
    `);

    return d;
  }

  async recursiveUpdateIsInBin(id: number, isInBin: boolean, tx?: PrismaTx): Promise<number> {
    const db = tx ?? this.prismaService;

    const d = await db.$executeRaw(Prisma.sql`
      WITH RECURSIVE AllAncestors AS (
        SELECT id, parent_id
        FROM file_structure
        WHERE id = ${id} and is_in_bin = false

        UNION ALL

        SELECT fs.id, fs.parent_id
        FROM file_structure fs
          JOIN AllAncestors p ON fs.parent_id = p.id
        WHERE fs.id <> p.id and is_in_bin = false
      )
        UPDATE file_structure SET is_in_bin = ${isInBin} WHERE id IN (SELECT id FROM AllAncestors);
    `);

    return d;
  }

  async updateById(id: number, data: UpdateFSParams, userId: number, tx?: PrismaTx): Promise<FileStructure> {
    const db = tx ?? this.prismaService;

    return db.fileStructure.update({
      where: {
        id,
        userId,
        isInBin: false,
      },
      data,
    });
  }

  async deleteById(id: number, tx?: PrismaTx): Promise<FileStructure> {
    const db = tx ?? this.prismaService;

    return db.fileStructure.delete({
      where: {
        id,
        isInBin: false,
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
}
