import { LegalDocumentType } from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';
import { LegalDocumentParagraphResponseDto } from './legal-document-paragraph-response.dto';

@Exclude()
export class LegalDocumentResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  type: LegalDocumentType;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => LegalDocumentParagraphResponseDto)
  paragraphs: LegalDocumentParagraphResponseDto[];
}
