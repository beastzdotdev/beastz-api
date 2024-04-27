import { Injectable } from '@nestjs/common';
import { FileStructureEncryption } from '@prisma/client';
import { PrismaService } from '../@global/prisma/prisma.service';
import { FileStructureEncryptionParams } from './file-structure-encryption.type';
import { PrismaTx } from '../@global/prisma/prisma.type';

@Injectable()
export class FileStructureEncryptionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getById(id: number, userId: number, tx?: PrismaTx): Promise<FileStructureEncryption | null> {
    const db = tx ?? this.prismaService;

    return db.fileStructureEncryption.findFirst({ where: { id, userId } });
  }

  async create(params: FileStructureEncryptionParams, tx?: PrismaTx): Promise<FileStructureEncryption> {
    const db = tx ?? this.prismaService;

    return db.fileStructureEncryption.create({ data: params });
  }

  async deleteById(id: number, userId: number, tx?: PrismaTx): Promise<FileStructureEncryption> {
    const db = tx ?? this.prismaService;

    return db.fileStructureEncryption.delete({ where: { id, userId } });
  }
}
