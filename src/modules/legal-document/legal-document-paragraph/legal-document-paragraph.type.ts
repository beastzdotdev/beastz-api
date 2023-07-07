import { Prisma } from '@prisma/client';

export type FilterLegalDocumentParagraphParams = {
  readonly legalDocumentId: number;
  readonly searchQuery?: string;
};

export type CreateLegalDocumentParagraphParams = Omit<Prisma.LegalDocumentParagraphUncheckedCreateInput, 'createdAt'>;

export type UpdateLegalDocumentParagraphParams = Omit<
  Prisma.LegalDocumentParagraphUncheckedUpdateInput,
  'createdAt' | 'legalDocumentId'
>;
