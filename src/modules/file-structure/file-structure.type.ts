import { FileMimeType, FileStructure, Prisma } from '@prisma/client';

export type CreateFileStructureParams = Omit<FileStructure, 'id' | 'createdAt'>;

export type ReplaceFileMethodParams = {
  path: string;
  userId: number;
  userRootContentPath: string;
  isFile: boolean;
};

export type IncreaseFileNameNumberMethodParams = {
  title: string;
  userId: number;
  isFile: boolean;
  parent?: FileStructure | null;
};

export type GetByMethodParamsInRepo = {
  depth?: number;
  title?: string;
  isFile?: boolean;
  userId?: number;
  path?: string;
  parentId?: number | null;
  isInBin?: boolean;
  fileExstensionRaw?: string;
  mimeTypeRaw?: string;
  sharedUniqueHash?: string;
};
export type GetManyByMethodParamsInRepo = {
  parentId?: number;
  titleStartsWith?: string;
  depth?: number;
  title?: string;
  isFile?: boolean;
  userId?: number;
  fileTypes?: FileMimeType[];

  isEditable?: boolean;
  isEncrypted?: boolean;
  isLocked?: boolean;
  isShortcut?: boolean;

  orderBy?: Prisma.FileStructureOrderByWithRelationInput;
};

export type UpdateFSParams = Omit<Prisma.FileStructureUncheckedUpdateInput, 'id' | 'createdAt'>;

export type ExistsByIdsReturnType = {
  allIdsExist: boolean;
  notFoundIds: number[];
};
