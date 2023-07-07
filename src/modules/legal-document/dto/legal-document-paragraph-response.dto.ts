import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class LegalDocumentParagraphResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  index: number;

  @Expose()
  createdAt: Date;

  @Expose()
  legalDocumentId: number;
}
