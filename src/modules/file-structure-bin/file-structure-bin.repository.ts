import { Injectable } from '@nestjs/common';
import { FileStructureBin, Prisma } from '@prisma/client';
import { PrismaService } from '../@global/prisma/prisma.service';
import { CreateFileStructureBinParams } from './file-structure-bin.type';
import { AuthPayloadType } from '../../model/auth.types';
import { GetFromBinQueryDto } from './dto/get-from-bin-query.dto';
import { Pagination } from '../../model/types';

@Injectable()
export class FileStructureBinRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(authPayload: AuthPayloadType, queryParams: GetFromBinQueryDto): Promise<Pagination<FileStructureBin>> {
    const { page, pageSize, parentId } = queryParams;

    const where: Prisma.FileStructureBinWhereInput = {
      userId: authPayload.user.id,
      fileStructure: {
        isInBin: true,
        parentId,
      },
    };

    console.log({ where, take: pageSize, skip: (page - 1) * pageSize });

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

  async create(params: CreateFileStructureBinParams): Promise<FileStructureBin> {
    return this.prismaService.fileStructureBin.create({ data: params });
  }
}
