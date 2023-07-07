import { forwardRef, Module } from '@nestjs/common';
import { LegalDocumentModule } from '../legal-document.module';
import { LegalDocumentParagraphRepository } from './legal-document-paragraph.repository';
import { LegalDocumentParagraphService } from './legal-document-paragraph.service';

@Module({
  imports: [forwardRef(() => LegalDocumentModule)],
  providers: [LegalDocumentParagraphRepository, LegalDocumentParagraphService],
  exports: [LegalDocumentParagraphService],
})
export class LegalDocumentParagraphModule {}
