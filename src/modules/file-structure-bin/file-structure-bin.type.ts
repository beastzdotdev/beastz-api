import { FileStructure, FileStructureBin } from '@prisma/client';

export type CreateFileStructureBinParams = Omit<FileStructureBin, 'id' | 'createdAt'>;

export type FileStructureBinWithRelation = FileStructureBin & {
  fileStructure: FileStructure;
};
