import { FileStructure } from '@prisma/client';

export type CreateFileStructureParams = Omit<FileStructure, 'id' | 'createdAt'>;

export type ReplaceFileMethodParams = {
  title: string;
  userId: number;
  userRootContentPath: string;
  parent?: FileStructure | null;
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
};
export type GetManyByMethodParamsInRepo = {
  titleStartsWith?: string;
  depth?: number;
  title?: string;
  isFile?: boolean;
  userId?: number;
};
