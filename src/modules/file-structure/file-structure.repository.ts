import { Injectable } from '@nestjs/common';
import { FileStructure, Prisma } from '@prisma/client';
import { PrismaService } from '../@global/prisma/prisma.service';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { CreateFileStructureParams, GetByMethodParamsInRepo, GetManyByMethodParamsInRepo } from './file-structure.type';

@Injectable()
export class FileStructureRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async existsById(id: number) {
    const count = await this.prismaService.fileStructure.count({ where: { id } });

    return count > 0;
  }

  async getById(id: number): Promise<FileStructure | null> {
    return this.prismaService.fileStructure.findFirst({
      where: { id },
    });
  }

  async getByIdForUser(id: number, userId: number): Promise<FileStructure | null> {
    return this.prismaService.fileStructure.findFirst({
      where: { id, userId },
    });
  }

  async getContentByParentId(id: number, userId: number): Promise<FileStructure[]> {
    return this.prismaService.fileStructure.findMany({
      where: {
        parentId: id,
        userId,
      },
    });
  }

  async getTotalFilesSize(userId: number): Promise<number> {
    const response = await this.prismaService.fileStructure.aggregate({
      where: {
        userId,
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
        ...(titleStartsWith ? { title: { startsWith: titleStartsWith } } : { title }),
      },
    });
  }

  async create(params: CreateFileStructureParams, tx?: PrismaTx): Promise<FileStructure> {
    const db = tx ?? this.prismaService;

    return db.fileStructure.create({ data: params });
  }

  async recursiveDeleteChildren(id: number) {
    const d = await this.prismaService.$executeRaw(Prisma.sql`
      WITH RECURSIVE FileStructureHierarchy AS (
        SELECT id, parent_id 
        FROM file_structure 
        WHERE id = ${id}
    
        UNION ALL
    
        SELECT fs.id, fs.parent_id 
        FROM file_structure fs 
          JOIN FileStructureHierarchy fsh ON fs.parent_id = fsh.id
      )
        DELETE FROM file_structure WHERE id IN (SELECT id FROM FileStructureHierarchy);
    `);

    return d;
  }

  async deleteById(id: number): Promise<FileStructure> {
    return this.prismaService.fileStructure.delete({
      where: {
        id,
      },
    });
  }
}
