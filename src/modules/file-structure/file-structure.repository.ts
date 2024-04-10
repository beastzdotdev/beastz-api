import { Injectable } from '@nestjs/common';
import { FileStructure, Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../@global/prisma/prisma.service';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { CreateFileStructureParams, GetByMethodParamsInRepo, GetManyByMethodParamsInRepo } from './file-structure.type';
import { FileStructureFromRaw } from './model/file-structure-from-raw';
import { UpdateFolderStructureDto } from './dto/update-folder-structure.dto';

@Injectable()
export class FileStructureRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getById(id: number): Promise<FileStructure | null> {
    return this.prismaService.fileStructure.findFirst({
      where: { id, isInBin: false },
    });
  }

  async getByIdForUser(id: number, userId: number): Promise<FileStructure | null> {
    return this.prismaService.fileStructure.findFirst({
      where: { id, userId, isInBin: false },
    });
  }

  async getTotalFilesSize(userId: number): Promise<number> {
    const response = await this.prismaService.fileStructure.aggregate({
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

  async getBy(params: GetByMethodParamsInRepo): Promise<FileStructure | null> {
    const { depth, isFile, title, userId, path, parentId } = params;

    if (!Object.values(params).length) {
      return null;
    }

    return this.prismaService.fileStructure.findFirst({
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

  async getManyBy(params: GetManyByMethodParamsInRepo): Promise<FileStructure[]> {
    const { depth, isFile, title, userId, titleStartsWith, parentId } = params;

    if (!Object.values(params).length) {
      return [];
    }

    return this.prismaService.fileStructure.findMany({
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

  async recursiveSelect(params: {
    userId: number;
    parentId?: number | null;
    depth?: number;
  }): Promise<FileStructureFromRaw[]> {
    const { userId, depth, parentId } = params;

    let rootParentIdCheck: Prisma.Sql = Prisma.empty; // parentId null here means null check in db

    // only check for undefined not null
    if (parentId !== undefined) {
      rootParentIdCheck =
        parentId === null ? Prisma.sql`and parent_id is null` : Prisma.sql`and parent_id = ${parentId}`;
    }

    let recursiveDepthCheck: Prisma.Sql = Prisma.empty;

    // only check for undefined not null
    if (depth !== undefined) {
      recursiveDepthCheck = Prisma.sql`and fs.depth <= ${depth}`;
    }

    const d = await this.prismaService.$queryRaw<unknown[]>(Prisma.sql`
      WITH RECURSIVE AllAncestors AS (
        SELECT *
        FROM file_structure
        WHERE is_in_bin = false
        and user_id = ${userId}
        ${rootParentIdCheck}

        UNION ALL

        SELECT fs.*
        FROM file_structure fs
            JOIN AllAncestors p ON fs.parent_id = p.id
        where fs.id <> p.id
          and fs.is_in_bin = false
          and fs.user_id = ${userId}
          ${recursiveDepthCheck}
      )
      SELECT distinct * FROM AllAncestors;
    `);

    return plainToInstance(FileStructureFromRaw, d, { exposeDefaultValues: true });
  }

  async create(params: CreateFileStructureParams, tx?: PrismaTx): Promise<FileStructure> {
    const db = tx ?? this.prismaService;

    return db.fileStructure.create({ data: params });
  }

  async recursiveDelete(id: number): Promise<number> {
    const d = await this.prismaService.$executeRaw(Prisma.sql`
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

  async recursiveUpdateIsInBin(id: number, isInBin: boolean): Promise<number> {
    const d = await this.prismaService.$executeRaw(Prisma.sql`
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

  async updateById(id: number, dto: UpdateFolderStructureDto, userId: number): Promise<FileStructure | null> {
    const { isInBin } = dto;

    return this.prismaService.fileStructure.update({
      where: {
        id,
        userId,
        isInBin: false,
      },
      data: {
        isInBin,
      },
    });
  }

  async deleteById(id: number): Promise<FileStructure> {
    return this.prismaService.fileStructure.delete({
      where: {
        id,
        isInBin: false,
      },
    });
  }
}
