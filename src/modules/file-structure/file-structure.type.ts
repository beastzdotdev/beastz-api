import { FileStructure } from '@prisma/client';

export type CreateFileStructureParams = Omit<FileStructure, 'id' | 'createdAt'>;
