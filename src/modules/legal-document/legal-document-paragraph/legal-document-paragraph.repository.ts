import { Injectable } from '@nestjs/common';
import { LegalDocumentParagraph, Prisma } from '@prisma/client';
import { PrismaService } from '../../@global/prisma/prisma.service';
import { prismaSafeCall } from '../../../common/helper';
import {
  CreateLegalDocumentParagraphParams,
  FilterLegalDocumentParagraphParams,
  UpdateLegalDocumentParagraphParams,
} from './legal-document-paragraph.type';

@Injectable()
export class LegalDocumentParagraphRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createEntity(params: CreateLegalDocumentParagraphParams): Promise<LegalDocumentParagraph> {
    return this.prismaService.legalDocumentParagraph.create({
      data: params,
    });
  }

  async updateById(id: number, params: UpdateLegalDocumentParagraphParams): Promise<LegalDocumentParagraph | null> {
    const entity = await this.prismaService.legalDocumentParagraph.findUnique({ where: { id } });
    if (!entity) {
      return null;
    }

    return this.prismaService.legalDocumentParagraph.update({
      where: { id },
      data: {
        ...entity,
        ...params,
      },
    });
  }

  async filter({
    legalDocumentId,
    searchQuery,
  }: FilterLegalDocumentParagraphParams): Promise<LegalDocumentParagraph[]> {
    const where: Prisma.LegalDocumentParagraphWhereInput = {
      ...(searchQuery && { title: { contains: searchQuery } }),
      legalDocumentId,
    };

    return this.prismaService.legalDocumentParagraph.findMany({
      where,
    });
  }

  async deleteById(id: number): Promise<boolean> {
    const { success } = await prismaSafeCall(() => this.prismaService.legalDocumentParagraph.delete({ where: { id } }));

    return success;
  }

  async getById(id: number): Promise<LegalDocumentParagraph | null> {
    return this.prismaService.legalDocumentParagraph.findUnique({ where: { id } });
  }
}
