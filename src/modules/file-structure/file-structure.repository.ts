import { Injectable } from '@nestjs/common';
import { FileStructure } from '@prisma/client';
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
    const { depth, isFile, title, userId } = params;

    if (!Object.values(params).length) {
      return null;
    }

    return this.prismaService.fileStructure.findFirst({
      where: {
        depth,
        isFile,
        userId,
        title,
      },
    });
  }

  async getManyBy(params: GetManyByMethodParamsInRepo): Promise<FileStructure[]> {
    const { depth, isFile, title, userId, titleStartsWith } = params;

    if (!Object.values(params).length) {
      return [];
    }

    return this.prismaService.fileStructure.findMany({
      where: {
        depth,
        isFile,
        userId,
        ...(titleStartsWith ? { title: { startsWith: titleStartsWith } } : { title }),
      },
    });
  }

  async create(params: CreateFileStructureParams, tx?: PrismaTx): Promise<FileStructure> {
    const db = tx ?? this.prismaService;

    return db.fileStructure.create({ data: params });
  }

  async deleteById(id: number): Promise<FileStructure> {
    return this.prismaService.fileStructure.delete({
      where: {
        id,
      },
    });
  }
}
