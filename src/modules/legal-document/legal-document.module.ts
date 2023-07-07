import { Module } from '@nestjs/common';
import { LegalDocumentParagraphModule } from './legal-document-paragraph/legal-document-paragraph.module';
import { LegalDocumentController } from './legal-document.controller';
import { LegalDocumentRepository } from './legal-document.repository';
import { LegalDocumentService } from './legal-document.service';

@Module({
  imports: [LegalDocumentParagraphModule],
  providers: [LegalDocumentRepository, LegalDocumentService],
  controllers: [LegalDocumentController],
  exports: [LegalDocumentService],
})
export class LegalDocumentModule {}
