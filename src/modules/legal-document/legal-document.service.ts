import { Injectable, NotFoundException } from '@nestjs/common';
import { LegalDocument, LegalDocumentType } from '@prisma/client';
import { LegalDocumentRepository } from './legal-document.repository';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';

@Injectable()
export class LegalDocumentService {
  constructor(private readonly legalDocumentRepository: LegalDocumentRepository) {}

  async validateLegalDocumentById(id: number | null): Promise<void> {
    if (!id) {
      return;
    }

    const legalDocumentExists = await this.legalDocumentRepository.existsById(id);
    if (!legalDocumentExists) {
      throw new NotFoundException(ExceptionMessageCode.LEGAL_DOCUMENT_NOT_FOUND);
    }
  }

  async getLegalDocumentByType(type: LegalDocumentType): Promise<LegalDocument> {
    const legalDocument = await this.legalDocumentRepository.getByType(type);

    if (!legalDocument) {
      throw new NotFoundException(ExceptionMessageCode.LEGAL_DOCUMENT_NOT_FOUND);
    }

    return legalDocument;
  }

  async getAllLegalDocuments(): Promise<LegalDocument[]> {
    return this.legalDocumentRepository.getAll();
  }
}
