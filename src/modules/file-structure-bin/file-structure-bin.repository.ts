import { Injectable } from '@nestjs/common';
import { FileStructureBin, Prisma } from '@prisma/client';
import { PrismaService } from '../@global/prisma/prisma.service';
import { CreateFileStructureBinParams, FileStructureBinWithRelation } from './file-structure-bin.type';
import { AuthPayloadType } from '../../model/auth.types';
import { GetFromBinQueryDto } from './dto/get-from-bin-query.dto';
import { Pagination } from '../../model/types';
import { PrismaTx } from '../@global/prisma/prisma.type';

@Injectable()
export class FileStructureBinRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(
    authPayload: AuthPayloadType,
    queryParams: GetFromBinQueryDto,
  ): Promise<Pagination<FileStructureBinWithRelation>> {
    const { page, pageSize, parentId } = queryParams;

    const where: Prisma.FileStructureBinWhereInput = {
      userId: authPayload.user.id,
      fileStructure: {
        isInBin: true,
        parentId,
      },
    };

    const [data, total] = await Promise.all([
      this.prismaService.fileStructureBin.findMany({
        relationLoadStrategy: 'join',
        where,
        include: {
          fileStructure: true,
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prismaService.fileStructureBin.count({
        where,
      }),
    ]);

    return {
      data,
      total,
    };
  }

  async getById(id: number, userId: number, tx: PrismaTx): Promise<FileStructureBin | null> {
    const db = tx ?? this.prismaService;

    return db.fileStructureBin.findFirst({ where: { id, userId } });
  }

  async getByFsId(fileStructureId: number, userId: number, tx: PrismaTx): Promise<FileStructureBin | null> {
    const db = tx ?? this.prismaService;

    return db.fileStructureBin.findFirst({ where: { fileStructureId, userId } });
  }

  async create(params: CreateFileStructureBinParams): Promise<FileStructureBin> {
    return this.prismaService.fileStructureBin.create({ data: params });
  }

  async deleteById(id: number, userId: number, tx: PrismaTx): Promise<FileStructureBin> {
    const db = tx ?? this.prismaService;

    return db.fileStructureBin.delete({ where: { id, userId } });
  }
}
