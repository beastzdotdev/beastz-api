import { FileStructureBin } from '@prisma/client';

export type CreateFileStructureBinParams = Omit<FileStructureBin, 'id' | 'createdAt'>;
