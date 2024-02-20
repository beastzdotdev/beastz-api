import { Injectable } from '@nestjs/common';
import { FileStructure } from '@prisma/client';
import { PrismaService } from '../@global/prisma/prisma.service';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { CreateFileStructureParams } from './file-structure.type';

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

  async create(params: CreateFileStructureParams, tx?: PrismaTx): Promise<FileStructure> {
    const db = tx ?? this.prismaService;

    return db.fileStructure.create({ data: params });
  }
}
