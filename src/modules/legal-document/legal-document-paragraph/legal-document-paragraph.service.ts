import { Injectable, NotFoundException } from '@nestjs/common';
import { LegalDocumentParagraph } from '@prisma/client';
import { LegalDocumentService } from '../legal-document.service';
import { LegalDocumentParagraphRepository } from './legal-document-paragraph.repository';
import { ExceptionMessageCode } from '../../../model/enum/exception-message-code.enum';
import {
  CreateLegalDocumentParagraphParams,
  FilterLegalDocumentParagraphParams,
  UpdateLegalDocumentParagraphParams,
} from './legal-document-paragraph.type';

@Injectable()
export class LegalDocumentParagraphService {
  constructor(
    private readonly legalDocumentParagraphRepository: LegalDocumentParagraphRepository,
    private readonly legalDocumentService: LegalDocumentService,
  ) {}

  async createLegalDocumentParagraph(params: CreateLegalDocumentParagraphParams): Promise<LegalDocumentParagraph> {
    await this.legalDocumentService.validateLegalDocumentById(params.legalDocumentId);

    return this.legalDocumentParagraphRepository.createEntity(params);
  }

  async filterLegalDocumentParagraphs(params: FilterLegalDocumentParagraphParams): Promise<LegalDocumentParagraph[]> {
    return this.legalDocumentParagraphRepository.filter(params);
  }

  async deleteLegalDocumentParagraphById(id: number): Promise<void> {
    const didDelete = await this.legalDocumentParagraphRepository.deleteById(id);

    if (!didDelete) {
      throw new NotFoundException(ExceptionMessageCode.LEGAL_DOCUMENT_PARAGRAPH_NOT_FOUND);
    }
  }

  async updateLegalDocumentParagraphById(
    id: number,
    params: UpdateLegalDocumentParagraphParams,
  ): Promise<LegalDocumentParagraph> {
    const legalDocumentParagraph = await this.legalDocumentParagraphRepository.updateById(id, params);

    if (!legalDocumentParagraph) {
      throw new NotFoundException(ExceptionMessageCode.LEGAL_DOCUMENT_PARAGRAPH_NOT_FOUND);
    }

    return legalDocumentParagraph;
  }

  async getLegalDocumentParagraphById(id: number): Promise<LegalDocumentParagraph> {
    const legalDocumentParagraph = await this.legalDocumentParagraphRepository.getById(id);

    if (!legalDocumentParagraph) {
      throw new NotFoundException(ExceptionMessageCode.LEGAL_DOCUMENT_PARAGRAPH_NOT_FOUND);
    }

    return legalDocumentParagraph;
  }
}
