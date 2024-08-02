import { FileStructurePublicShare } from '@prisma/client';

export type CreateFileStructurePublicShare = Omit<FileStructurePublicShare, 'id' | 'createdAt'>;
