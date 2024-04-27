import { FileStructureEncryption } from '@prisma/client';

export type FileStructureEncryptionParams = Omit<FileStructureEncryption, 'id' | 'createdAt'>;
