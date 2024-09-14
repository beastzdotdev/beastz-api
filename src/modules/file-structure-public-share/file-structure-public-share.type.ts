import { FileStructure, FileStructurePublicShare, Prisma } from '@prisma/client';

export type CreateFileStructurePublicShare = Omit<FileStructurePublicShare, 'id' | 'createdAt'>;

export type GetByMethodParamsInFsPublicShare = {
  fileStructureId?: number;
  uniqueHash?: string;
  userId?: number;
};

export type UpdateFsPublicShareParams = Omit<
  Prisma.FileStructurePublicShareUpdateInput,
  'createdAt' | 'user' | 'fileStructure'
>;

export type FsPublicShareForSocketUser = FileStructurePublicShare & {
  fileStructure: Pick<FileStructure, 'id' | 'path'>;
};
