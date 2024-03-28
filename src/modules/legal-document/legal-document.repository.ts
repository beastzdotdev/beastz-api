import { Injectable } from '@nestjs/common';
import { LegalDocument, LegalDocumentType } from '@prisma/client';
import { PrismaService } from '../@global/prisma/prisma.service';

@Injectable()
export class LegalDocumentRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getByType(type: LegalDocumentType): Promise<LegalDocument | null> {
    return this.prismaService.legalDocument.findUnique({
      relationLoadStrategy: 'join',
      where: { type },
      include: { paragraphs: { orderBy: { index: 'asc' } } },
    });
  }

  async getAll(): Promise<LegalDocument[]> {
    return this.prismaService.legalDocument.findMany({
      relationLoadStrategy: 'join',
      include: {
        paragraphs: {
          orderBy: {
            index: 'asc',
          },
        },
      },
    });
  }

  async existsById(id: number): Promise<boolean> {
    const count = await this.prismaService.legalDocument.count({ where: { id } });

    return count > 0;
  }
}
