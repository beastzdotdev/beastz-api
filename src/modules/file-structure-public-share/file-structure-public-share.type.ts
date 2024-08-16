import { FileStructurePublicShare } from '@prisma/client';

export type CreateFileStructurePublicShare = Omit<FileStructurePublicShare, 'id' | 'createdAt'>;

export type GetByMethodParamsInFsPublicShare = {
  fileStructureId?: number;
  uniqueHash?: string;
  userId?: number;
};
